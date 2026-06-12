;(function ($) {
  'use strict'

  var API = typeof SOULFOOD_API !== 'undefined' ? SOULFOOD_API : 'http://localhost:8787'

  function renderMenu(data) {
    var $container = $('#dynamic-menu')
    if (!$container.length) return

    $container.empty()

    if (!data.categories || !data.categories.length) {
      $container.html('<p style="text-align:center;color:#999;padding:40px 0">Menu coming soon.</p>')
      return
    }

    data.categories.forEach(function (cat) {
      if (!cat.items || !cat.items.length) return

      var html = ''
      html += '<div class="title"><h3><span>' + cat.name + '</span></h3></div>'
      html += '<ul>'

      cat.items.forEach(function (item) {
        var priceFormatted = 'R ' + item.price.toFixed(2)
        var starchHtml = item.starch ? '<p><b>Choice of Starch</b> : ' + item.starch + '</p>' : ''

        html += '<li class="wow fadeInUp" data-wow-duration="300ms" data-wow-delay="300ms">'
        html +=   '<div class="item">'
        html +=     '<div class="item-title">'
        html +=       '<h2>' + item.name + '</h2>'
        html +=       '<div class="border-bottom"></div>'
        html +=       '<span>' + priceFormatted + '</span>'
        html +=     '</div>'
        html +=     '<p>' + (item.description || '') + '</p>'
        html +=     starchHtml
        html +=     '<button class="add-to-cart" data-id="' + item.id + '" data-title="' + item.name + '" data-price="' + item.price + '" data-starch="' + (item.starch || '') + '">Add to Cart</button>'
        html +=   '</div>'
        html += '</li>'
      })

      html += '</ul>'
      $container.append(html)
    })

    if (window.WOW) {
      new WOW().init()
    }
  }

  function loadMenu() {
    $.ajax({
      url: API + '/api/public/menu',
      dataType: 'json',
      success: renderMenu,
      error: function () {
        var $container = $('#dynamic-menu')
        if ($container.length) {
          $container.html('<p style="text-align:center;color:#999;padding:40px 0">Unable to load menu. Please try again later.</p>')
        }
      }
    })
  }

  $(document).ready(function () {
    loadMenu()
  })
})(jQuery)
