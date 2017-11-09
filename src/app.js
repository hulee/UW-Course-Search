var apiKey = 'bd10a06e1fff60f571d805b7f219972c';
var baseUrl = "https://api.uwaterloo.ca/v2/courses";

var command_init_data_received = "init_data_received";
var command_multiple_data_received = "multiple_data_received";
var command_more_info_received = "more_info_received";
var command_single_data_received = "single_data_received";
var command_invalid_input = "invalid_input";

(function(exports) {

	/* A Model class */
    class AppModel {
	constructor() {
		this._observers = [];
            	this._subject;
            	this._catalog;
            	this._online;
	}

        onlyOnline() {
            return this._online;
        }

        getInputs() {
            var that = this;
            var msg;
            var endpointUrl;
            $("button#searchButton").click(function() {
                that._subject = $("div#subjectContent").find("#subject").val();
                that._catalog = $("div#catalogContent").find("#catalog").val();
                that._online = $("div#onlineContent").find("#online").is(':checked');

                if (that._subject !== '' && that._catalog === '') {
                    msg = command_multiple_data_received;
                    endpointUrl = baseUrl + "/" + that._subject;
                }
                else if (that._subject !== '' && that._catalog !== '') {
                    msg = command_single_data_received;
                    endpointUrl = baseUrl + "/" + that._subject + "/" + that._catalog;
                }     
                that.loadData(endpointUrl, msg);
            });
        }

        // Call this function to retrieve data from a UW API endpoint
        loadData(endpointUrl, msg) {
            var that = this;

            $.getJSON(endpointUrl + ".json?key=" + apiKey,
                function (data) {
                    if (jQuery.isEmptyObject(data.data)) {
                        that.notify(command_invalid_input);
                    }
                    else {
                        var returnedResult = {key: msg, value: data.data};
                        that.notify(returnedResult);
                    }
                }
            );
        }
		
	// Add an observer to the list
	addObserver(observer) {
            this._observers.push(observer);
            observer.updateView(this, null);
        }
		
		// Notify all the observers on the list
	notify(args) {
            var that = this;
            _.forEach(this._observers, function(obs) {
                obs.updateView(that, args);
            });
        }
    }

    /*
     * A view class.
     * model:  the model we're observing
     * div:  the HTML div where the content goes
     */
    class AppView {
	constructor(model, div) {
		this.model = model;
		this.div = div;
            	this.count = 0;
		model.addObserver(this); // Add this View as an Observer
	}

        initData(data) {
            var subjectArray = [];
            _.forEach(data, function(info) {
                subjectArray.push(info.subject);
            });
            subjectArray = _.uniq(subjectArray);

            var subject = $("div#subjectContent").find("#subject");

            _.forEach(subjectArray, function(info) {
                var subjectOption = document.createElement("option");
                subjectOption.value = info;
                subjectOption.textContent = info;
                subject.append(subjectOption);
            });
        }

        createTable() {
            var resultHeader = document.createElement("h3");
            var courseTable = document.createElement("table");

            resultHeader.id = "resultHeader";
            resultHeader.textContent = "Result";
            courseTable.id = "courseTable";

            var headerRow = document.createElement("tr");
            headerRow.id = "headerRow";
            var headerCode = document.createElement("th");
            headerCode.id = "headerCode";
            headerCode.textContent = "Course Code";
            var headerTitle = document.createElement("th");
            headerTitle.id = "headerTitle";
            headerTitle.textContent = "Course Title";
            var headerTerm = document.createElement("th");
            headerTerm.id = "headerTerm";
            headerTerm.textContent = "Term";
            var headerOffer = document.createElement("th");
            headerOffer.id = "headerOffer";
            headerOffer.textContent = "Offer";

            $(headerRow).append(headerCode);
            $(headerRow).append(headerTitle);
            $(headerRow).append(headerTerm);
            $(headerRow).append(headerOffer);
            $(courseTable).append(headerRow);

            $("div#filterContent").hide();
            $("div#tableContent").append(resultHeader);
            $("div#tableContent").append(courseTable);
            $("div#tableContent").show();           
        }

        parseData(data, msg) {
            var that = this;
            var courseInfo = [];

            if (msg === command_multiple_data_received) {
                _.forEach(data, function(info) {
                    var endpointUrl = baseUrl + "/" + info.subject + "/" + info.catalog_number;
                    that.model.loadData(endpointUrl, command_more_info_received);
                });
            }
            else if (msg === command_single_data_received) {
                courseInfo.push(data.subject + data.catalog_number);
                courseInfo.push(data.title);

                if (data.terms_offered.length === 0) {
                    courseInfo.push("N/A");
                }
                else {
                    courseInfo.push(data.terms_offered);
                }

                if (data.offerings.conrad_grebel === true) {
                    courseInfo.push("Main Campus & Conrad Grebel");
                }
                else if (data.offerings.conrad_grebel_only === true) {
                    courseInfo.push("Conrad Grebel (Only)");
                }
                else if (data.offerings.online === true) {
                    courseInfo.push("Main Campus & Online");
                }
                else if (data.offerings.online_only === true) {
                    courseInfo.push("Online (Only)");
                }
                else if (data.offerings.st_jerome === true) {
                    courseInfo.push("Main Campus & St.Jerome");
                }
                else if (data.offerings.st_jerome_only === true) {
                    courseInfo.push("St.Jerome (Only)");
                }
                else {
                    if (data.terms_offered.length === 0) {
                        courseInfo.push("N/A");
                    }
                    else {
                        courseInfo.push("Main Campus");
                    }
                }

                if (this.model.onlyOnline()) {
                    if (courseInfo[3] === "Main Campus & Online" || courseInfo[3] === "Online (Only)") {
                        this.addTableRow(courseInfo);
                    }
                }
                else {
                    this.addTableRow(courseInfo);
                }
            }
        }

        addTableRow(parsedData) {
            var that = this;
            var courseTableContent;
            var courseCode;
            var courseTitle;
            var courseTerm;
            var courseOffer;

            courseTableContent = document.createElement("tr");
            courseTableContent.id = "courseTableContent" + that.count;

            courseCode = document.createElement("td");
            courseCode.id = "courseCode" + that.count;
            courseCode.textContent = parsedData[0];

            courseTitle = document.createElement("td");
            courseTitle.id = "courseTitle" + that.count;
            courseTitle.textContent = parsedData[1];

            courseTerm = document.createElement("td");
            courseTerm.id = "courseTerm" + that.count;
            courseTerm.textContent = parsedData[2];

            courseOffer = document.createElement("td");
            courseOffer.id = "courseOffer" + that.count;
            courseOffer.textContent = parsedData[3];

            $(courseTableContent).append(courseCode);
            $(courseTableContent).append(courseTitle);
            $(courseTableContent).append(courseTerm);
            $(courseTableContent).append(courseOffer);
            $("table#courseTable").append(courseTableContent);
            this.count++;
        }

        updateView(obs, args) {
            if (args === null) {
                obs.loadData(baseUrl, command_init_data_received);
                obs.getInputs();
            }
            else {
                if (args.key === command_init_data_received) {
                    this.initData(args.value);
                }
                else if (args.key === command_multiple_data_received) {
                    this.createTable();
                    this.parseData(args.value, args.key);
                }
                else if (args.key === command_single_data_received) {
                    this.createTable();
                    this.parseData(args.value, args.key);
                }
                else if (args.key === command_more_info_received) {
                    this.parseData(args.value, command_single_data_received);
                }
                else if (args === command_invalid_input) {
                    this.createTable();
                }
            }
        }        
    }

	/*
		Function that will be called to start the app.
		Complete it with any additional initialization.
	*/
    exports.startApp = function() {
        var model = new AppModel();
        var view = new AppView(model, "div#viewContent");
    }

})(window);
