/**
 * SMK Checkout v2.0 — Kundtypsväljare + fältlogik
 * Smålands Kontorsmöbler — Searchboost
 */
(function($) {
    'use strict';

    var currentType = 'company';

    function smkSetType(type) {
        currentType = type;

        // Toggle active button
        $('.smk-toggle-btn').removeClass('smk-active');
        $('.smk-toggle-btn[data-type="' + type + '"]').addClass('smk-active');

        // Toggle hints
        $('.smk-customer-type-hint').hide();
        $('.smk-hint-' + type).fadeIn(200);

        if (type === 'company') {
            $('.smk-field-company').closest('.form-row').slideDown(200);
            $('.smk-field-private').closest('.form-row').slideUp(200);
            $('#billing_company_field').slideDown(200);
            $('#billing_company').prop('required', true);
            $('.smk-show-company').show();
            $('.smk-show-private').hide();
        } else {
            $('.smk-field-private').closest('.form-row').slideDown(200);
            $('.smk-field-company').closest('.form-row').slideUp(200);
            $('#billing_company_field').slideUp(200);
            $('#billing_company').val('').prop('required', false);
            $('.smk-show-private').show();
            $('.smk-show-company').hide();
        }

        // AJAX — uppdatera session + trigga checkout-refresh
        $.post(smkCheckout.ajaxUrl, {
            action: 'smk_set_customer_type',
            type: type
        }, function() {
            $('body').trigger('update_checkout');
        });
    }

    $(function() {
        // Klick på toggle-knappar
        $('.smk-toggle-btn').on('click', function(e) {
            e.preventDefault();
            var type = $(this).data('type');
            $(this).find('input[type=radio]').prop('checked', true);
            smkSetType(type);
        });

        // Initial state
        smkSetType('company');

        // Behåll rätt state efter AJAX-refresh
        $(document).on('updated_checkout', function() {
            if (currentType === 'private') {
                $('.smk-field-company').closest('.form-row').hide();
                $('#billing_company_field').hide();
                $('.smk-show-company').hide();
                $('.smk-show-private').show();
            } else {
                $('.smk-field-private').closest('.form-row').hide();
                $('.smk-show-private').hide();
                $('.smk-show-company').show();
            }
        });
    });

})(jQuery);
