var carYears = [];

(function($) {

    var apiHostname;

    var $carYears;
    var $carMakes;
    var $carModels;
    var $carMileages;
    var $submitButton;
    var onSelectChangeEvent;
    var onRefreshEvent;

    var selectedYear = 'default';
    var selectedMake = 'default';
    var selectedModel = 'default';
    var selectedMileage = 'default';


    /**
     * Refreshes all components needed
     *
     */
    function refresh() {

        try {
            // rebuild any select pickers
            $('.selectpicker').selectpicker('refresh');

        } catch(err) {
            console.log(err);
        }

        if(typeof onRefreshEvent !== 'undefined' && onRefreshEvent !== null) {
            onRefreshEvent();
        }

    }

    /**
     * Triggered after all the other change events
     *
     */
    function catchAllChange()
    {
        // update all selected values
        selectedYear = parseInt($carYears.val()) >= 1000 ? parseInt($carYears.val())  : "default";
        selectedMake = ($carMakes.val().length >= 1 && (!$carMakes.val().startsWith('--')) ? $carMakes.val() : 'default');
        selectedModel = ($carModels.val().length >= 1 && (!$carModels.val().startsWith('--')) ? $carModels.val() : 'default');
        selectedMileage = ($carMileages.val().length >= 1 && (!$carMileages.val().startsWith('--')) ? $carMileages.val() : 'default');

        // always disable continue button
        $submitButton.prop('disabled', 1);

        // determine what to disable
        if(selectedYear === 'default' || $carMakes.children().length < 2) {

            $carMakes.prop('disabled', 1);
            $carMakes.val('default');
            $carMakes.find("option:gt(0)").remove();

            $carModels.prop('disabled', 1);
            $carModels.val('default');
            $carModels.find("option:gt(0)").remove();

            $carMileages.prop('disabled', 1);
            $carMileages.val('default');

        }
        else if(selectedMake === 'default' || $carModels.children().length < 2) {

            $carModels.prop('disabled', 1);
            $carModels.val('default');
            $carModels.find("option:gt(0)").remove();

            $carMileages.prop('disabled', 1);
            $carMileages.val('default');

        }
        else if(selectedModel === 'default') {

            $carMileages.prop('disabled', 1);
            $carMileages.val('default');

        }
        else if(selectedMileage === 'default') {

        }
        else {

            $submitButton.prop('disabled', 0);

        }

        refresh();

        if(typeof onSelectChangeEvent !== 'undefined' && onSelectChangeEvent !== null) {
            onSelectChangeEvent(this);
        }
    }

    /**
     * Builds all the year <option> elements under car year selector
     *
     */
    function buildCarYearSelector() {

        if(carYears.length < 1) {

            $carYears.prop('disabled', 1);

            $.ajax({

                async: true,
                url: apiHostname + '/api/car-data/years',
                cache: false

            }).done(function(data) {

                carYears = data;

                // recall myself to build options
                buildCarYearSelector();

            });

        }

        // see if we've already built <options> under our <select>
        if(carYears.length < 1 || $carYears.children().length >= 2) {
            return;
        }

        carYears.forEach(function(year) {
            $carYears.append("<option value=\"" + year.toString() + "\">" + year.toString() + "</option>");
        });

        $carYears.prop('disabled', 0);
        $carYears.change();
    }

    /**
     * Event triggered when user selects car year
     */
    function carYearOnSelect() {

        console.log('selected year: [' + selectedYear + ']');
        if(selectedYear === 'default') {
            return;
        }

        // append new option values
        $carMakes.prop('disabled', 1);
        $carMakes.find("option:gt(0)").remove();
        $carModels.prop('disabled', 1);
        $carModels.find("option:gt(0)").remove();
        refresh();

        // kick off search for year and make
        $.ajax({

            async: true,
            url: apiHostname + '/api/car-data/makes/' + selectedYear.toString(),
            cache: false

        }).done(function(data) {

            data.forEach(function(make) {

                $carMakes.append("<option value=\"" + make.make + "\" data-car-make-id=\"" + make.id + "\">" + make.make + "</option>");

            });

            $carMakes.prop('disabled', 0);
            $carMakes.change();

        });

    }

    /**
     * Event triggered when user selects car make
     */
    function carMakeOnSelect() {

        console.log('selected make: [' + selectedMake + ']');
        if(selectedMake === 'default') {
            return;
        }

        var carMakeId = $(this).find(":selected").data('car-make-id');

        // append new option values
        $carModels.prop('disabled', 1);
        $carModels.find("option:gt(0)").remove();

        // kick off search for year and make
        $.ajax({

            async: true,
            url: apiHostname + '/api/car-data/models/' + carMakeId.toString(),
            cache: false

        }).done(function(data) {

            data.forEach(function(model) {

                $carModels.append("<option value=\"" + model + "\" data-car-make-id=\"" + carMakeId + "\">" + model + "</option>");

            });

            $carModels.prop('disabled', 0);
            $carModels.change();

        });


    }

    /**
     * Event triggered when user selects car model
     */
    function carModelOnSelect() {

        console.log('selected model: [' + selectedModel + ']');

        $carMileages.prop('disabled', 0);
        $carMileages.change();
    }

    /**
     * Event triggered when user selects car mileage
     */
    function carMileageOnSelect() {

        console.log('selected mileage: [' + selectedMileage + ']');

    }

    $.fn.carsSelector = function(options) {

        var settings = $.extend({

            // These are the defaults.
            apiHostname: "",
            yearSelector: "#car-year",
            makeSelector: "#car-make",
            modelSelector: "#car-model",
            mileageSelector: "#car-mileage",
            submitSelector: "#continue-btn",
            onSelect: null,
            onRefresh: null

        }, options);

        $carYears = $(settings.yearSelector);
        $carMakes = $(settings.makeSelector);
        $carModels = $(settings.modelSelector);
        $carMileages = $(settings.mileageSelector);
        $submitButton = $(settings.submitSelector);
        apiHostname = settings.apiHostname;

        // // make sure they're set as select pickers
        // if(!$carYears.hasClass('selectpicker')) {
        //     $carYears.addClass('selectpicker');
        // }
        // if(!$carMakes.hasClass('selectpicker')) {
        //     $carMakes.addClass('selectpicker');
        // }
        // if(!$carModels.hasClass('selectpicker')) {
        //     $carModels.addClass('selectpicker');
        // }

        // setup events
        $carYears.change(catchAllChange).change(carYearOnSelect);
        $carMakes.change(catchAllChange).change(carMakeOnSelect);
        $carModels.change(catchAllChange).change(carModelOnSelect);
        $carMileages.change(catchAllChange).change(carMileageOnSelect);

        onSelectChangeEvent = settings.onSelect;
        onRefreshEvent = settings.onRefresh;

        // build years selector
        buildCarYearSelector();

        return this;
    };

}(jQuery));
 