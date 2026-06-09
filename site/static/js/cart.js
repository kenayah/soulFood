;(function ($) {
  'use strict'

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

    add: function (item) {
      var items = this.get()
      var existing = items.filter(function (i) { return i.id === item.id })[0]
      if (existing) {
        existing.qty += item.qty || 1
      } else {
        items.push({ id: item.id, title: item.title, price: item.price, starch: item.starch || '', qty: item.qty || 1 })
      }
      this.save(items)
    },

    remove: function (id) {
      this.save(this.get().filter(function (i) { return i.id !== id }))
    },

    updateQty: function (id, qty) {
      if (qty < 1) { this.remove(id); return }
      var items = this.get()
      items.forEach(function (i) { if (i.id === id) i.qty = qty })
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
      var items = this.get()
      var $body = $('#cart-items')
      var $empty = $('#cart-empty')
      var $footer = $('#cart-footer')

      $body.empty()

      if (!items.length) {
        $empty.show()
        $footer.hide()
        return
      }

      $empty.hide()
      $footer.show()

      items.forEach(function (item) {
        $body.append(
          '<div class="cart-item" data-id="' + item.id + '">' +
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

    open: function () {
      this.render()
      $('#cart-overlay').fadeIn(200)
      $('#cart-drawer').addClass('open')
      $('body').css('overflow', 'hidden')
    },

    close: function () {
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
        var item = {
          id: $btn.data('id'),
          title: $btn.data('title'),
          price: parseFloat($btn.data('price')) || 0,
          starch: $btn.data('starch') || ''
        }
        self.add(item)

        $btn.text('Added!').addClass('added')
        setTimeout(function () {
          $btn.text('Add to Cart').removeClass('added')
        }, 1200)
      })

      $(document).on('click', '.cart-qty-btn', function () {
        var $item = $(this).closest('.cart-item')
        var id = $item.data('id')
        var $input = $item.find('.cart-qty-input')
        var qty = parseInt($input.val(), 10)
        var action = $(this).data('action')

        if (action === 'inc') qty++
        else if (action === 'dec') qty--

        self.updateQty(id, qty)
      })

      $(document).on('click', '.cart-item-remove', function () {
        var id = $(this).closest('.cart-item').data('id')
        self.remove(id)
      })

      $(document).on('click', '#cart-clear', function () {
        if (confirm('Clear your entire order?')) self.clear()
      })

      $(document).on('click', '#cart-checkout', function () {
        if (!self.getCount()) return
        self.close()
        var total = self.getTotal().toFixed(2)
        var items = self.get().map(function (i) { return i.qty + 'x ' + i.title }).join('\n')
        var msg = 'New Order:\n' + items + '\n\nTotal: R ' + total + '\n\nPlease call to confirm.'
        var phone = '0694660013'
        window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank')
      })
    }
  }

  $(document).ready(function () {
    Cart.init()
  })
})(jQuery)
