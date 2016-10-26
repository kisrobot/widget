(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node / CommonJS
    factory(require('jquery'));
  } else {
    // Browser globals.
    factory(jQuery);
  }
})(function ($) {

  'use strict';

  var $body = $('body');
  var NAMESPACE = 'qor.widget';
  var EVENT_ENABLE = 'enable.' + NAMESPACE;
  var EVENT_DISABLE = 'disable.' + NAMESPACE;
  var EVENT_CHANGE = 'change.' + NAMESPACE;
  var TARGET_WIDGET = '[name="QorResource.Widgets"]';
  var TARGET_WIDGET_KIND = '[name="QorResource.Kind"]';
  var CLASS_IS_NEW = 'qor-layout__widget-new';
  var CLASS_FORM_SECTION = '.qor-form-section';
  var CLASS_FORM_SETTING = '.qor-layout__widget-setting';

  function QorWidget(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, QorWidget.DEFAULTS, $.isPlainObject(options) && options);
    this.init();
  }

  QorWidget.prototype = {
    constructor: QorWidget,

    init: function () {
      this.bind();
      this.isNewForm = this.$element.hasClass(CLASS_IS_NEW);
      this.addWidgetSlideout();
      this.initSelect();
    },

    bind: function () {
      this.$element.on(EVENT_CHANGE, 'select', this.change.bind(this));
    },

    unbind: function () {
      this.$element.off(EVENT_CHANGE, 'select', this.change.bind(this));
    },

    initSelect: function () {
      var $select = $('select'),
          $element = this.$element,
          $kind = $(TARGET_WIDGET_KIND);

      $select.closest(CLASS_FORM_SECTION).hide();
      $select.each(function () {
        // TODO:
        if ($(this).find('option').filter('[value!=""]').size() >= 2) {
          $(this).closest(CLASS_FORM_SECTION).show();
        }
      });

      if (this.isNewForm) {
        $select.filter(TARGET_WIDGET).trigger('change');
      } else {
        if (!$kind.parent().next('.qor-form-section-rows').children().length) {
          $kind.closest('.qor-form-section').hide();
          if (!$element.find('.qor-field__label').is(':visible')) {
            $element.append('<h2 class="qor-page__tips">' + $element.data('hint') + '</h2>').parent().find('.qor-form__actions').remove();
          }
        }
      }

    },

    addWidgetSlideout: function () {
      var $select = $(TARGET_WIDGET);
      var tabScopeActive = $body.data('tabScopeActive');
      var isInSlideout = $('.qor-slideout').is(':visible');
      var actionUrl = $select.closest('form').data("action-url") || $select.closest('form').prop('action');
      var url;
      var clickTmpl;

      $select.find('option').each(function () {
        var $this = $(this);
        var val = $this.val();

        if (val) {
          url =  actionUrl + '?widget_type=' + val;

          if (tabScopeActive){
            url =  url + '&widget_scope=' + tabScopeActive;
          }

          if (isInSlideout) {
            clickTmpl = '<a href=' + url + ' style="display: none;" class="qor-widget-' + val + '" data-open-type="slideout" data-url="' + url + '">' + val + '</a>';
          } else {
            clickTmpl = '<a href=' + url + ' style="display: none;" class="qor-widget-' + val + '">' + val + '</a>';
          }

          $select.after(clickTmpl);

        }

      });
    },

    change: function (e) {
      var $target = $(e.target),
          widgetValue = $target.val(),
          isInSlideout = $('.qor-slideout').is(':visible');

      if (!$target.is(TARGET_WIDGET)) {
        return;
      }
      var clickClass = '.qor-widget-' + widgetValue,
          $link = $(clickClass),
          url = $link.prop('href');

      $.fn.qorSlideoutBeforeHide = null;
      window.onbeforeunload = null;

      if (this.isNewForm) {
        this.getFormHtml(url);
      } else {
        if (isInSlideout) {
          $link.trigger('click');
        } else {
          location.href = url;
        }
      }

      return false;
    },

    getFormHtml: function (url) {
      var $setting = $(CLASS_FORM_SETTING),
          $loading = $(QorWidget.TEMPLATE_LOADING).appendTo($setting);

      window.componentHandler.upgradeElement($loading.children()[0]);
      $.get(url, function(html) {
        $setting.html(html).trigger('enable');
      }).fail(function() {
        window.alert('server error, please try again!');
      });
    },

    destroy: function () {
      this.unbind();
    }
  };

  QorWidget.DEFAULTS = {};

  QorWidget.TEMPLATE_LOADING = '<div style="text-align: center; margin-top: 30px;"><div class="mdl-spinner mdl-js-spinner is-active qor-layout__bottomsheet-spinner"></div></div>';

  QorWidget.plugin = function (options) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data(NAMESPACE);
      var fn;

      if (!data) {
        if (/destroy/.test(options)) {
          return;
        }

        $this.data(NAMESPACE, (data = new QorWidget(this, options)));
      }

      if (typeof options === 'string' && $.isFunction(fn = data[options])) {
        fn.apply(data);
      }
    });
  };

  $(function () {
    var selector = '[data-toggle="qor.widget"]';

    $(document)
      .on(EVENT_DISABLE, function (e) {
        QorWidget.plugin.call($(selector, e.target), 'destroy');
      })
      .on(EVENT_ENABLE, function (e) {
        QorWidget.plugin.call($(selector, e.target));
      })
      .triggerHandler(EVENT_ENABLE);

      if ($('.qor-page__header .qor-page-subnav__header').length) {
        $('.mdl-layout__content').addClass('has-subnav');
      }
  });

  return QorWidget;

});
