function getAllUrlParams(url) {

    // get query string from url (optional) or window
    var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

    // we'll store the parameters here
    var obj = {};

    // if query string exists
    if (queryString) {

        // stuff after # is not part of query string, so get rid of it
        queryString = queryString.split('#')[0];

        // split our query string into its component parts
        var arr = queryString.split('&');

        for (var i=0; i<arr.length; i++) {
            // separate the keys and the values
            var a = arr[i].split('=');

            // in case params look like: list[]=thing1&list[]=thing2
            var paramNum = undefined;
            var paramName = a[0].replace(/\[\d*\]/, function(v) {
                paramNum = v.slice(1,-1);
                return '';
            });

            // set parameter value (use 'true' if empty)
            var paramValue = typeof(a[1])==='undefined' ? true : a[1];

            // (optional) keep case consistent
            paramName = paramName.toLowerCase();
            paramValue = paramValue.toLowerCase();

            // if parameter name already exists
            if (obj[paramName]) {
                // convert value to array (if still string)
                if (typeof obj[paramName] === 'string') {
                    obj[paramName] = [obj[paramName]];
                }
                // if no array index number specified...
                if (typeof paramNum === 'undefined') {
                    // put the value on the end of the array
                    obj[paramName].push(paramValue);
                }
                // if array index number specified...
                else {
                    // put the value at that index number
                    obj[paramName][paramNum] = paramValue;
                }
            }
            // if param name doesn't exist yet, set it
            else {
                obj[paramName] = paramValue;
            }
        }
    }

    return obj;
}

var getSPAContentCompleted = function(response) {

    var ajaxWrap = $('.form-ajax-wrap');
    var loader = $('.form-loader');
    var parent = ajaxWrap.parent();

    // set content
    ajaxWrap.html(response.html);

    // if the loader is shown, hide it now
    if(loader.is(':visible')) {
        loader.hide();
    }

    // slide in the new content (reverse direction if loaded a previous step)
    var slideDirection = (response.is_from_goback === false ? 'right' : 'left');
    if(response.has_errors === true) {
        ajaxWrap.show();
    } else {
        ajaxWrap.show("slide", { direction: slideDirection, queue: false }, 150);
    }

    // scroll to top of page to ensure they see current step in full (helps alot on mobile)
    $('html, body').animate({
        scrollTop: 0
    }, 150, function() {
        // animation callback
    });

    // if not successful - do shake animation on response
    if(response.success !== true) {
        console.log('ERROR: RESPONSE NOT SUCCESSFUL');
    }

    // re-setup form events every time to pick up new elements
    window.setupSPAFormEvents();
    window.setupSPABackButtonEvents();

    // replace history state for better URLs
    if(response.hasOwnProperty('step')) {

        var historyUrl = '#';
        if (response.step > 1 && response.hasOwnProperty('mode') && response.mode !== undefined && response.mode !== null) {
            historyUrl += "mode_" + response.mode + "-";
        }
        // else {
        //     historyUrl += "mode_null-";
        // }
        historyUrl += "step_" + response.step;

        history.replaceState({
            step: response.step,
            mode: response.mode
        }, null, historyUrl);

    }

};

/**
 * Fires an AJAX request for dynamic content to be filled
 *
 *
 * @param url
 * @param post_data
 * @param completed_event
 */
window.getSPAContent = function(url, post_data, completed_event) {

    var ajaxWrap = $('.form-ajax-wrap');
    var loader = $('.form-loader');
    var parent = ajaxWrap.parent();

    // add 1px padding to fix slide animation from jumping in height
    ajaxWrap.css('padding', '1px');

    // if previous content is shown, slide to left and disappear
    if(ajaxWrap.is(':visible')) {

        ajaxWrap.hide(25, function() {

            // call our self again when the animation is complete
            window.getSPAContent(url, post_data, completed_event);

        });

        return;
    }

    // show the loader
    if(!loader.is(':visible')) {
        loader.show();
    }

    // clear out previous content
    ajaxWrap.html('');

    // wipe out previous google maps API library
    window.google = {};

    // build ajax request
    var request = {
        url: url,
        method: 'GET',
        cache: false,
        dataType: 'json'
    };

    // add variant from parent URL
    var queryParams = getAllUrlParams();
    if(queryParams.hasOwnProperty('variant')) {

        if(!request.url.includes("?")) {
            request.url += "?";
        }
        if(request.url.substring(request.url.length - 1) !== '?') {
            request.url += "&";
        }
        request.url += "variant=" + getAllUrlParams().variant;

    }

    // if post data, switch to POST
    if (post_data !== undefined && post_data !== null) {

        request.method = 'POST';
        request.data = post_data;

    }

    // load in the step submit process
    $.ajax(request)

        .always(function(response) {

            // check if there is a redirect to go to instead of dynamically placing content
            if (response.hasOwnProperty('redirect_url') && response.redirect_url !== undefined && response.redirect_url !== null) {

                window.location = response.redirect_url;

            } else {

                getSPAContentCompleted(response);

            }

            // if there is a completed event, fire it
            if(completed_event !== undefined && completed_event !== null) {

                completed_event();

            }

        });

};




window.setupSPAFormEvents = function()
{
    var form = $("form");
    $('button').click(function() {
        if($(this).attr('name')) {
            $(form).append(
                $("<input type='hidden'>").attr( {
                    name: $(this).attr('name'),
                    value: $(this).attr('value') })
            );
        }
    });

    var ajaxWrap = $('.form-ajax-wrap');

    if(!ajaxWrap.attr('setupevents')) {

        ajaxWrap.on('submit', function(e) {

            var link = $(this).find('form').attr('action');
            var ths = $(this);

            window.getSPAContent(link, ths.find('form').serializeArray());

            e.preventDefault();
            return false;

        });

        ajaxWrap.attr('setupevents', 'true');
    }


};

window.setupSPABackButtonEvents = function() {

    $('.spa-back-btn').on('click', function(e) {

        var frm = $('.form-ajax-wrap').find('form');
        window.getSPAContent(frm.attr('action'), frm.serializeArray());

        e.preventDefault();
        return false;

    });

};

// keep track of current field step number
window.current_field_set = 1;
window.current_field_set_prefix = '.step-';

jQuery(document).ready(function() {

    // next step
    $('.btn-next').on('click', function () {

        var fieldset = $(window.current_field_set_prefix + window.current_field_set.toString());
        var next_step = true;

        fieldset.find('input[type="text"],input[type="email"],input[type="phone"]').each(function () {
            if ($(this).val() == "") {
                $(this).addClass('input-error');
                next_step = false;
            } else {
                $(this).removeClass('input-error');
            }
        });

        // fade out this step and fade in next
        if (next_step) {

            // hide first step shit
            if(window.current_field_set === 1) {

                $('.form-title').fadeOut();

                $('.form-bottom-box').fadeOut();

            }

            window.current_field_set++;

            fieldset.fadeOut(400, function () {

                $('.form-loader').show();

                // show next page in 400ms
                setTimeout(function() {

                    $('.form-loader').hide();

                    $(window.current_field_set_prefix + window.current_field_set.toString()).fadeIn();

                    $('.form-title').html("<h2 class=\"styleFontface\" style=\"font-family: 'Lato', Arial, Helvetica, sans-serif\">Last step</h2>primary driver details").fadeIn();

                    $('.form-bottom-box').html("<button title=\"Start saving\" class=\"button button-orange btn-next\" id=\"continue-btn\">START SAVING <i class=\"fa fa-angle-right\"></i></button>").fadeIn();

                }, 400);



            });


        }

    });

    // $("#form").on("submit", function (event) {
    //
    //     // everything looks good!
    //     event.preventDefault();
    //
    //     window.parent_fieldset = $(this).parents('fieldset');
    //
    //     $.ajax({
    //
    //         type: "POST",
    //         url: '/submit',
    //         cache: false,
    //         data: {
    //             debt_amount: $("#left-amount").val(),
    //             first_name: $("#fname").val(),
    //             last_name: $("#lname").val(),
    //             email: $("#email").val(),
    //             zip: $("#zip").val(),
    //             phone_number: $("#phone").val(),
    //             behind_on_payments: behind_on_payments,
    //             _token: Laravel.csrfToken
    //         },
    //
    //         success : function(json_response, status_code) {
    //
    //
    //             // console.log(json_response);
    //             // console.log('status code: [' + status_code + ']');
    //             // console.log('text: [' + json_response.success + ']');
    //
    //
    //             if (json_response.success === true) {
    //
    //                 // console.log(json_response);
    //
    //                 // fire the conversion pixel
    //                 $('<img />').attr('src', json_response.pixel);
    //
    //                 // track on FB (old way)
    //                 // fbq('track', 'VictoryDebtLead');
    //
    //                 $('#thank-you-first-name').text(json_response.first_name);
    //
    //                 $('#alert-header').hide();
    //
    //                 $('#step-3').fadeOut(400, function () {
    //
    //                     $('#thank-you').fadeIn();
    //
    //                 });
    //
    //
    //
    //
    //             } else {
    //
    //                 window.parent_fieldset.find('input[type="text"],input[type="email"],input[type="phone"]').each(function () {
    //                     $(this).addClass('input-error');
    //                 });
    //
    //                 $('#alert-header').fadeIn();
    //
    //                 var target = $('#contact-details-div');
    //
    //                 $('html, body').animate({
    //                     scrollTop: target.offset().top
    //                 }, 1000);
    //                 target.focus(); // Setting focus
    //                 if (target.is(":focus")){ // Checking if the target was focused
    //                 } else {
    //                     target.attr('tabindex','-1'); // Adding tabindex for elements not focusable
    //                     target.focus(); // Setting focus
    //                 }
    //
    //             }
    //         }
    //     });
    //
    // });

});


