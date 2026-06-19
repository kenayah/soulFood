;(function ($) {
  'use strict'

  var API = typeof SOULFOOD_API !== 'undefined' ? SOULFOOD_API : 'http://localhost:8787'

  var pendingItem = null

  function parseStarchOptions(str) {
    if (!str) return []
    return str.split(/\s+or\s+/).filter(Boolean)
  }

  function showStarchPicker(options, callback) {
    var $picker = $('#starch-picker')
    var $options = $('#starch-picker-options')
    $options.empty()

    options.forEach(function (opt) {
      $options.append('<button class="starch-picker-option" data-value="' + opt + '">' + opt + '</button>')
    })

    $picker.addClass('open')

    $options.off('click.starch').on('click.starch', '.starch-picker-option', function () {
      var selected = $(this).data('value')
      $picker.removeClass('open')
      callback(selected)
    })

    $('#starch-picker-cancel').off('click.starch').on('click.starch', function () {
      $picker.removeClass('open')
      pendingItem = null
    })
  }

  var Cart = {
    key: 'soulfood_cart',

    get: function () {
      try {
        return JSON.parse(localStorage.getItem(this.key)) || []
      } catch (e) {
        return []
      }
    },

    save: function (items) {
      localStorage.setItem(this.key, JSON.stringify(items))
      this.updateBadge()
      this.render()
    },

    _key: function (item) {
      return item.id + '::' + (item.starch || '')
    },

    add: function (item) {
      var items = this.get()
      var key = this._key(item)
      var existing = items.filter(function (i) { return this._key(i) === key }.bind(this))[0]
      if (existing) {
        existing.qty += item.qty || 1
      } else {
        items.push({ id: item.id, title: item.title, price: item.price, starch: item.starch || '', qty: item.qty || 1 })
      }
      this.save(items)
    },

    remove: function (key) {
      this.save(this.get().filter(function (i) { return this._key(i) !== key }.bind(this)))
    },

    updateQty: function (key, qty) {
      if (qty < 1) { this.remove(key); return }
      var items = this.get()
      items.forEach(function (i) { if (this._key(i) === key) i.qty = qty }.bind(this))
      this.save(items)
    },

    clear: function () {
      this.save([])
    },

    getCount: function () {
      return this.get().reduce(function (sum, i) { return sum + i.qty }, 0)
    },

    getTotal: function () {
      return this.get().reduce(function (sum, i) { return sum + i.price * i.qty }, 0)
    },

    updateBadge: function () {
      var count = this.getCount()
      $('.cart-badge').text(count).toggle(count > 0)
    },

    render: function () {
      var self = this
      var items = this.get()
      var $body = $('#cart-items')
      var $empty = $('#cart-empty')
      var $footer = $('#cart-footer')
      var $form = $('#checkout-form')

      $body.empty()
      $form.hide()
      $('#cart-checkout').show()
      $('#cart-submit-order').hide()
      $('#cart-back').hide()
      $('#cart-clear').show()

      if (!items.length) {
        $empty.show()
        $footer.hide()
        return
      }

      $empty.hide()
      $footer.show()

      items.forEach(function (item) {
        $body.append(
          '<div class="cart-item" data-key="' + self._key(item) + '">' +
            '<div class="cart-item-info">' +
              '<div class="cart-item-title">' + item.title + '</div>' +
              (item.starch ? '<div class="cart-item-starch">' + item.starch + '</div>' : '') +
            '</div>' +
            '<div class="cart-item-controls">' +
              '<button class="cart-qty-btn" data-action="dec">-</button>' +
              '<input type="number" class="cart-qty-input" value="' + item.qty + '" min="1" readonly>' +
              '<button class="cart-qty-btn" data-action="inc">+</button>' +
              '<span class="cart-item-price">R ' + (item.price * item.qty).toFixed(2) + '</span>' +
              '<button class="cart-item-remove" title="Remove">&times;</button>' +
            '</div>' +
          '</div>'
        )
      })

      $('#cart-total-amount').text('R ' + this.getTotal().toFixed(2))
    },

    _fillCheckout: function () {
      var saved
      try { saved = JSON.parse(localStorage.getItem('soulfood_checkout')) } catch (e) {}
      if (saved) {
        if (!document.getElementById('checkout-name').value) $('#checkout-name').val(saved.name || '')
        if (!document.getElementById('checkout-phone').value) $('#checkout-phone').val(saved.phone || '')
        if (!document.getElementById('checkout-address').value) $('#checkout-address').val(saved.address || '')
        if (!document.getElementById('checkout-notes').value) $('#checkout-notes').val(saved.notes || '')
      }
    },

    showCheckout: function () {
      this._fillCheckout()
      $('#cart-items').hide()
      $('#cart-empty').hide()
      $('#checkout-form').show()
      $('#cart-checkout').hide()
      $('#cart-submit-order').show()
      $('#cart-back').show()
      $('#checkout-error').hide()
    },

    hideCheckout: function () {
      $('#cart-items').show()
      $('#checkout-form').hide()
      $('#cart-checkout').show()
      $('#cart-submit-order').hide()
      $('#cart-back').hide()
      $('#checkout-error').hide()
    },

    showError: function (msg) {
      $('#checkout-error').text(msg).show()
    },

    submitOrder: function () {
      var self = this
      var name = $('#checkout-name').val().trim()
      var phone = $('#checkout-phone').val().trim()
      var address = $('#checkout-address').val().trim()
      var notes = $('#checkout-notes').val().trim()
      var paymentMethod = $('input[name="payment"]:checked').val() || 'card'

      if (!name) { self.showError('Please enter your name'); return }
      if (!phone) { self.showError('Please enter your phone number'); return }

      var items = this.get()
      var total = this.getTotal()

      var payload = {
        customerName: name,
        phone: phone,
        deliveryAddress: address || undefined,
        notes: notes || undefined,
        paymentMethod: paymentMethod,
        items: items.map(function (i) {
          var menuItemId = parseInt(i.id, 10)
          var itemName = i.title + (i.starch ? ' (' + i.starch + ')' : '')
          return isNaN(menuItemId) ? { menuItemId: 0, quantity: i.qty, itemName: itemName, unitPrice: i.price } : { menuItemId: menuItemId, quantity: i.qty, itemName: itemName }
        })
      }

      $('#cart-submit-order').prop('disabled', true).text('Submitting...')

      $.ajax({
        url: API + '/api/orders',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (order) {
          try {
            localStorage.setItem('soulfood_checkout', JSON.stringify({ name: name, phone: phone, address: address, notes: notes }))
          } catch (e) {}

          if (order.redirectUrl) {
            self.clear()
            self.close()
            sessionStorage.setItem('soulfood_pending_order', JSON.stringify({
              id: order.id,
              items: items,
              total: total,
              name: name,
              phone: phone,
              address: address,
              notes: notes,
            }))
            window.location.href = order.redirectUrl
            return
          }

          var msg = 'Order #' + order.id + ' confirmed!\n' +
            items.map(function (i) { return i.qty + 'x ' + i.title + (i.starch ? ' (' + i.starch + ')' : '') }).join('\n') +
            '\n\nTotal: R ' + total.toFixed(2) +
            '\n\nName: ' + name +
            '\nPhone: ' + phone +
            (address ? '\nAddress: ' + address : '') +
            (notes ? '\nNotes: ' + notes : '') +
            '\n\nWe will call to confirm.'
          self.clear()
          self.close()
          window.open('https://wa.me/0694660013?text=' + encodeURIComponent(msg), '_blank')
        },
        error: function (xhr) {
          $('#cart-submit-order').prop('disabled', false).text('Submit Order')
          var msg = 'Could not place order'
          try {
            var err = JSON.parse(xhr.responseText)
            if (err.error && err.error.message) {
              msg = err.error.message
            } else if (err.error) {
              msg += ': ' + JSON.stringify(err.error)
            }
          } catch (e) {}
          self.showError(msg)
        }
      })
    },

    open: function () {
      this.render()
      $('#cart-overlay').fadeIn(200)
      $('#cart-drawer').addClass('open')
      $('body').css('overflow', 'hidden')
    },

    close: function () {
      this.hideCheckout()
      $('#cart-overlay').fadeOut(200)
      $('#cart-drawer').removeClass('open')
      $('body').css('overflow', '')
    },

    init: function () {
      this.updateBadge()

      var self = this

      $(document).on('click', '.cart-toggle', function (e) {
        e.preventDefault()
        self.open()
      })

      $(document).on('click', '#cart-overlay, #cart-close', function () {
        self.close()
      })

      $(document).on('click', '.add-to-cart', function () {
        var $btn = $(this)
        var starch = ($btn.data('starch') || '').trim()
        var options = parseStarchOptions(starch)

        if (options.length > 1) {
          pendingItem = {
            id: $btn.data('id'),
            title: $btn.data('title'),
            price: parseFloat($btn.data('price')) || 0
          }
          showStarchPicker(options, function (choice) {
            pendingItem.starch = choice
            self.add(pendingItem)
            pendingItem = null
            $btn.text('Added!').addClass('added')
            setTimeout(function () {
              $btn.text('Add to Cart').removeClass('added')
            }, 1200)
          })
          return
        }

        var item = {
          id: $btn.data('id'),
          title: $btn.data('title'),
          price: parseFloat($btn.data('price')) || 0,
          starch: starch
        }
        self.add(item)

        $btn.text('Added!').addClass('added')
        setTimeout(function () {
          $btn.text('Add to Cart').removeClass('added')
        }, 1200)
      })

      $(document).on('click', '.cart-qty-btn', function () {
        var $item = $(this).closest('.cart-item')
        var key = $item.data('key')
        var $input = $item.find('.cart-qty-input')
        var qty = parseInt($input.val(), 10)
        var action = $(this).data('action')

        if (action === 'inc') qty++
        else if (action === 'dec') qty--

        self.updateQty(key, qty)
      })

      $(document).on('click', '.cart-item-remove', function () {
        var key = $(this).closest('.cart-item').data('key')
        self.remove(key)
      })

      $(document).on('click', '#cart-clear', function () {
        if (confirm('Clear your entire order?')) self.clear()
      })

      $(document).on('click', '#cart-checkout', function () {
        if (!self.getCount()) return
        self.showCheckout()
      })

      $(document).on('click', '#cart-back', function () {
        self.hideCheckout()
      })

      $(document).on('click', '#cart-submit-order', function () {
        self.submitOrder()
      })
    }
  }

  function handlePaymentReturn() {
    var params = new URLSearchParams(window.location.search)
    var payment = params.get('payment')
    if (!payment) return

    var orderId = params.get('order')

    if (payment === 'success') {
      var pending = sessionStorage.getItem('soulfood_pending_order')
      if (pending) {
        var data = JSON.parse(pending)
        var msg = 'Order #' + data.id + ' paid and confirmed!\n' +
          data.items.map(function (i) { return i.qty + 'x ' + i.title + (i.starch ? ' (' + i.starch + ')' : '') }).join('\n') +
          '\n\nTotal: R ' + data.total.toFixed(2) +
          '\n\nName: ' + data.name +
          '\nPhone: ' + data.phone +
          (data.address ? '\nAddress: ' + data.address : '') +
          (data.notes ? '\nNotes: ' + data.notes : '') +
          '\n\nYour order is being prepared!'
        sessionStorage.removeItem('soulfood_pending_order')
        window.open('https://wa.me/0694660013?text=' + encodeURIComponent(msg), '_blank')
      }
      showPaymentBanner('Payment successful! Order #' + orderId + ' has been confirmed.', 'success')
    } else if (payment === 'cancelled') {
      showPaymentBanner('Payment was cancelled. Your order #' + orderId + ' is pending — please try again.', 'error')
    }

    // Clean URL params
    var url = window.location.pathname + window.location.hash
    window.history.replaceState(null, '', url)
  }

  function showPaymentBanner(msg, type) {
    var $banner = $('#payment-banner')
    if (!$banner.length) {
      $banner = $('<div id="payment-banner" class="payment-banner"></div>')
      $('body').prepend($banner)
    }
    $banner
      .text(msg)
      .removeClass('payment-banner--success payment-banner--error')
      .addClass('payment-banner--' + type)
      .addClass('payment-banner--visible')

    setTimeout(function () {
      $banner.removeClass('payment-banner--visible')
    }, 8000)
  }

  $(document).ready(function () {
    handlePaymentReturn()
    Cart.init()
  })
})(jQuery)
