sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sfh_memo/utils/Constants",
	"sfh_memo/utils/DoRequest"
], function (Controller, Constants, DoRequest) {
	"use strict";

	return Controller.extend("sfh_memo.controller.BaseController", {

		/**
		 * This BaseController is a library of common functions used in UI5
		 * 
		 * @file   
		 * @author Daniel-Stefan Dragolea.
		 * @since  01.02.2020
		 */

		doRequest: DoRequest,

		/**

		 * This class initalize the fragment helper
		 * 
		 * @class 
		 * @example
		 * 
		 * let newFragment = new this.InitalizeFragmentDispatcher(this);
		 * newFragment.showFragment(fragmentNameFullPath, callbackFunction); // fragmentNameFullPath => sfh_memo.view.fragments.CheckDialogMessages
		 */

		InitalizeFragmentDispatcher: class {

			// PRIVATE VARIABLES

			constructor(controllerContextParam) {

				/*
				 * @property controllerContextParam  		{Object} 		The current controller context from where the class is being called.
				 */

				this.controllerContext = controllerContextParam;

				this._FRAGMENT_STATE = {
					IS_NOT_ADDED: false,
					IS_ADDED: true
				};
			}

			closeFragmentDialog(fullPath) {
				if (this._isFragmentAdded(fullPath))
					this.controllerContext._fragmentHelper[fullPath].close();
			}

			openFragmentDialog(fullPath) {
				if (this._isFragmentAdded(fullPath))
					this.controllerContext._fragmentHelper[fullPath].open();
			}

			_addFragmentHelper() {
				if (this.controllerContext._fragmentHelper === undefined)
					this.controllerContext._fragmentHelper = {};
			}

			_substractFragmentID(fullPath) {
				return fullPath.substring(fullPath.lastIndexOf('.') + 1); // E.G. 'sapui5.smart.view.fragments.SalesOrder' => SalesOrder
			}

			_isFragmentAdded(fullPath) {
				if (this.controllerContext._fragmentHelper)
					if (this.controllerContext._fragmentHelper[fullPath])
						return this._FRAGMENT_STATE.IS_ADDED;

				return this._FRAGMENT_STATE.IS_NOT_ADDED;
			}

			_loadFragment(fullPath) {
				let that = this;

				try {
					this._addFragmentHelper();

					return sap.ui.core.Fragment.load({
						id: this._substractFragmentID(fullPath),
						name: fullPath,
						type: 'XML',
						controller: this.controllerContext
					});

				} catch (error) {
					this.controllerContext.messageBox._errorMessage(`Error loading fragment ${fullPath}`, error);
				}
			}

			_hasCallback(callback) {
				(typeof callback === 'function')
				return true;
			}

			/**
			 * This method loads and shows the fragment.
			 * @param 		fullPath 				{string} 			Full path of the fragment e.g. 'crm.component.view.fragments.Sales_Order'.
			 * @param 		callbackFunction		{Function} 			This callback will be called when the fragment was loaded and can contain E.G. Calling a webservice to set the model
			 * @memberof InitalizeFragmentDispatcher
			 * @method
			 */

			showFragment(fullPath, callbackFunction) { /** @callback 	callbackFunction */
				let that = this;

				if (this._isFragmentAdded(fullPath) === this._FRAGMENT_STATE.IS_ADDED)
					this.openFragmentDialog(fullPath);
				else
				if (this._isFragmentAdded(fullPath) === this._FRAGMENT_STATE.IS_NOT_ADDED) {
					let loadedFragment = this._loadFragment(fullPath);

					loadedFragment.then(function (dialog) {
						that.controllerContext.getView().addDependent(dialog);
						that.controllerContext._fragmentHelper[fullPath] = dialog;

					});

					loadedFragment.finally(function () {
						if (that._hasCallback(callbackFunction))
							callbackFunction.call(that.controllerContext, that.controllerContext._fragmentHelper[fullPath]);

						that.openFragmentDialog(fullPath);

					});

					loadedFragment.catch(function (error) {
						that.controllerContext.messageBox._errorMessage(`Error showing fragment ${fullPath}`, error);
						that.closeFragmentDialog(fullPath);
					});
				}
			}
		},

		/**
		 * This methods destroy a fragment 
		 * @param 	fullPath 	{string} 		Full path of the fragment e.g.	'crm.component.view.fragments.Sales_Order' where 'crm' where :
		 *																					'crm'					path name of the app defined in index.html
		 *																					'crm.component' 		path name of the component defined in Component.js
		 *																					'crm.component.view'	path name of the views
		 * @example 	
		 * this.destroyFragment('crm.component.view.fragments.Sales_Order');
		 */

		destroyFragment: function (fullPath) {
			if (this._fragmentHelper) {
				if (this._fragmentHelper.hasOwnProperty(fullPath)) {
					if (this._fragmentHelper[fullPath] !== null) {
						this._fragmentHelper[fullPath].destroy();
						this._fragmentHelper[fullPath] = null;
					}
				}
			}
		},

		/**
		 * This methods returns UI5 constructor with the given ID as param
		 * 
		 * @param 	ID 	{string} 		ID of the control to be checked and returned.
		 * @returns 	{constructor} 	Constructor of the given ID as param
		 * @example 	this.getViewControlByID('controlID');
		 *
		 */

		getViewControlByID: function (ID) {
			let assertionControl = sap.ui.require('sap/base/assert'),
				_checkParameter = function (controlID) {
					if (controlID !== undefined || controlID !== '') {
						if (this.getView().byId(ID))
							return true;
					}

					return false;
				};

			if (_checkParameter.call(this, ID))
				return this.byId(ID) || this.getView().byId(ID);
			else {
				assertionControl(false, `Control ${ID} does not exists`);
				return;
			}
		},

		/**
		 * This method returns the router
		 * @returns {sap.ui.core.routing.Router}
		 */

		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * This method checks the file type of the (unified:FileUploader property fileType="csv, xls...") of the uploaded file from the unified:FileUploader event typeMissmatch
		 * 
		 * @event checkFileType
		 * @type {object}
		 * @returns {MessageToast} Message box with the files which are not supported.
		 * @example this.checkFileType(event);
		 */

		checkFileType: function (fileUploaderEvent) {
			const FILE_TYPE = fileUploaderEvent.getSource().getFileType();
			let supportedFileType = `*.${FILE_TYPE[0]}`,
				uploadedFileType = fileUploaderEvent.getParameter('fileType');

			sap.m.MessageToast.show("The file type *." + uploadedFileType + " is not supported. Choose one of the following types: " +
				supportedFileType);
		},

		/**
		 * This method formats in currency format the given param;
		 * By default this function gets formatOptions
		 *	- decimals : 0
		 *	- groupingEnabled : true
		 *	- groupingSeparator '.'
		 * @param 	valueToFormat 		{string|number} String or number to be formatted in currency format.
		 * @param	[formatOptions] 	{object}		Format options of type sap.ui.core.format.NumberFormat
		 * @returns 					{string}		The formatted currency value
		 * @example
		 * 
		 * this.formatValueToCurrency('558792', formatOptions);
		 * this.formatValueToCurrency(558792, formatOptions);
		 * this.formatValueToCurrency(558792); // => This will parse number to the default formatOptions
		 */

		formatValueToCurrency: function (valueToFormat = 0, formatOptions = {
			decimals: 2,
			decimalSeparator: ',',
			groupingSeparator: '.',
			showMeasure: false
		}) {

			let numberToFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance(formatOptions);

			return numberToFormat.format(valueToFormat);
		},

		/**
		 * This method returns new error message
		 * 
		 * @param 	errorMessage 	{string} message to be showed
		 * @returns 				{object} 
		 * @example this.catchError('error mesage');
		 */

		catchError: function (errorMessage) {
			return new Error(errorMessage);
		},

		/**
		 * This method formats the given parameter in UTC date format
		 * 
		 * @param 	{date}		objectDate  	Object date of JS type DATE
		 * @param 	{string} 	[datePattern] 	Date target pattern E.G. 'yyyy-MM-dd'
		 * @returns {string} 					The formatted date value in the target pattern
		 * 
		 * @example
		 * this.formatDateToUTC(new Date())
		 * this.formatDateToUTC(new Date(), 'yyyy-MM-dd'));
		 */

		formatDateToUTC: function (objectDate, datePattern = 'dd-MM-YYYY') {
			let newDate = sap.ui.core.format.DateFormat.getInstance({
				pattern: datePattern
			});

			return newDate.format(objectDate);

		},

		constants: function () {
			return Constants;
		}(),

		/**
		 * This method retrieves the component model name with the given model name.
		 * 
		 * @param 	modelName 	{string} 				The model name
		 * @returns 			{sap.ui.model.Model} 	The model instance
		 * @example 
		 * 
		 * this.getOwnerComponentModel('NAME_OF_THE_MODEL');
		 * this.getOwnerComponentModel().getModel(); // GETS THE DEFAULT MODEL SET IN MANIFEST.JSON
		 */

		getOwnerComponentModel: function (modelName = undefined) {
			return this.getOwnerComponent().getModel(modelName);
		},

		/**
		 * This method retrieves the model name with the given model name.
		 * 
		 * @param 	modelName 	{string} 				The model name which needs to be retrieved from the current view.
		 * @returns 			{sap.ui.model.Model} 	The model instance
		 * @example this.getViewModel('exampleModelName');
		 */

		getViewModel: function (modelName) {
			return this.getView().getModel(modelName);
		},

		/**
		 * This method sets the model to the view
		 * 
		 * @param modelInstance {sap.ui.model.Model} 	New JSON Model instance
		 * @param modelName 	{string}  				The new model name
		 * @returns 			{sap.ui.mvc.View} 		The view instance
		 * 
		 * @example 
		 * this.setViewModel(new sap.ui.model.json.JSONModel({}), 'exampleModelName')
		 */

		setViewModel: function (modelInstance, modelName) {
			return this.getView().setModel(modelInstance, modelName);
		},

		/**
		 * This method returns the resourceBundle i81n
		 * @private
		 * @returns {sap.ui.model.resource.ResourceModel} The resourceModel of the component
		 * @example this.getResourceBundle();
		 */

		_isResourceBundleEnabled: function () {
			if (this.getOwnerComponent().getModel("i18n")) {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			} else {
				this.messageBox.showErrorMessage(`i18n file is not set !`);
				return false;
			}
		},

		/**
		 * This method returns text from the resourceBundle i18n
		 * @param i18nTextLabel {string} 	The given i18n label from the i18n.properties
		 * @returns 			{string} 	I18n TEXT LABEL
		 * @example this.getText('TEXT_LABEL_FROM_I18N');
		 * 
		 */

		getText: function (i18nTextLabel, placeHolder) {
			if (this._isResourceBundleEnabled()) {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(i18nTextLabel, [placeHolder]);
			}
		},

		/**
		 * This methods nav back to the previous hash
		 * @example 
		 * 
		 * In controllers
		 * 
		 * this.backNavigation();
		 * 
		 * -----------------
		 * 
		 * In views
		 * 
		 * <Page 
		 *  showNavButton="true"
		 *  navButtonPress="backNavigation">
		 * </Page>
		 */

		backNavigation: function () {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#Shell-home"
					}
				});
			}
		},

		/**
		 * This method creates a JSON Device model for (Desktop, Tablet, Phone)
		 * 
		 * @returns {true | false}
		 * @example
		 * 
		 * this.getDevice.isPhone();
		 * this.getDevice.isTablet();
		 * this.getDevice.deviceOrientation().isLandscape();
		 */

		getDevice: function () {
			const DEVICE_MODEL = new sap.ui.model.json.JSONModel({
				isTouch: sap.ui.Device.support.touch,
				isNoTouch: !sap.ui.Device.support.touch,
				isPhone: sap.ui.Device.system.phone,
				isNoPhone: !sap.ui.Device.system.phone,
				isTablet: sap.ui.Device.system.tablet,
				isNoTablet: !sap.ui.Device.system.tablet,
				isDesktop: sap.ui.Device.system.desktop,
				isNoDesktop: !sap.ui.Device.system.desktop,
				listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
				listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive"
			});

			DEVICE_MODEL.setDefaultBindingMode("OneWay");

			return {
				isPhone: function () {
					if (DEVICE_MODEL.getData().isPhone && DEVICE_MODEL.getData().isTouch)
						return true;

					return false;
				},
				isTablet: function () {
					if (DEVICE_MODEL.getData().isTablet && DEVICE_MODEL.getData().isTouch)
						return true;

					return false;
				},
				isDesktop: function () {
					if (DEVICE_MODEL.getData().isDesktop)
						return true;

					return false;
				},
				deviceOrientation: function () {
					return {
						isLandscape: function () {
							if (sap.ui.Device.orientation.landscape)
								return true;

							return false;
						},
						isPortrait: function () {
							if (sap.ui.Device.orientation.portrait)
								return true;

							return false;
						}
					};

				}
			};
		}(),

		/**
		 * This method creates a MessageBox of type error and success instance with the given message
		 * @param textMessage 	{string} 					Given parameter object date of type Date
		 * @param 				{string} [detailMessage] 	Message to be showned in more detail, can contain html tags
		 * @example
		 * this.messageBox.showErrorMessage('MESSAGE', '<p> <strong> HTML TAGS </strong> </p> \n');
		 * this.messageBox.showSuccessMessage('MESSAGE');
		 * this.messageBox.showWarningMessage('MESSAGE');
		 */

		messageBox: function () {
			function _errorMessage(message, detailText) {
				sap.m.MessageBox.error(message, {
					title: 'Error',
					onClose: null,
					initialFocus: null,
					details: detailText,
					textDirection: sap.ui.core.TextDirection.Inherit,
					contentWidth: 'auto'
				});
			}

			function _successMessage(entities, detailText = null) {
				sap.m.MessageBox.success(entities.message, {
					title: entities.title,
					onClose: null,
					initialFocus: null,
					details: detailText,
					textDirection: sap.ui.core.TextDirection.Inherit,
					contentWidth: 'auto'
				});
			}

			function _warningMessage(message, detailText = null) {
				sap.m.MessageBox.warning(message, {
					title: 'Waarschuwing',
					onClose: null,
					initialFocus: null,
					details: detailText,
					textDirection: sap.ui.core.TextDirection.Inherit,
					contentWidth: 'auto'
				});
			}

			return {
				showErrorMessage: function (textMessage, detailMessage = null) {
					_errorMessage(textMessage, detailMessage);
				},
				showSuccessMessage: function (textMessage, detailMessage = null) {
					_successMessage(textMessage, detailMessage);
				},
				showWarningMessage: function (textMessage, detailMessage = null) {
					_warningMessage(textMessage, detailMessage);
				}
			};
		}(),

		/**
		 * This method triggers the busy state of the control
		 * 
		 * @param controlID {string} 	Unique control ID 
		 * @param isBusy 	{boolean} 	State of the busy 
		 * 
		 * @example 
		 * this.showBusy('CONTROL_ID', true);
		 * this.showBusy('CONTROL_ID', false);
		 * 
		 */

		showBusy: function (controlID, isBusy) {
			let uiControl = this.getViewControlByID(controlID);

			if (uiControl.setBusy) {
				uiControl.setBusyIndicatorDelay = 0;
				uiControl.setBusyIndicatorSize = 'auto';

				uiControl.setBusy(isBusy);
			}
		},

		/**
		 * Substract the parameter from the URL by it's key.
		 * @param urlParamName 	{String} 	The parameter name which needs to be substracted from the URL; E.G. www.google.com?NAME=someTextName, NAME is the urlParamName argument
		 * @return 				{String} 	The value of the parameter
		 */

		extractUrlParamater: function (urlParamName) {
			var params = [],
				urlParamValue = '',
				regexp = new RegExp(urlParamName, 'gi');

			params = window.location.search.substr(1).split('&');

			for (var i = 0; i < params.length; i++) {
				if (params[i].search(regexp) != -1) {
					var localArray = params[i].split('=');
					if (localArray.length == 2) {
						urlParamValue = localArray[1];
						break;
					}
				}
			}
			return urlParamValue;
		},

		/**
		 * This method checks if a string, object, array is empty
		 * @param dataObject 			{String | Object} 	
		 * @return 						{true | false} 	True if it's empty or False if is not empty
		 */

		isEmpty: function (dataObject) {
			if (typeof (dataObject) === 'object') {
				if (JSON.stringify(dataObject) === '{}' || JSON.stringify(dataObject) === '[]') {
					return true;
				} else if (!dataObject) {
					return true;
				}
				return false;
			} else if (typeof (dataObject) === 'string') {
				if (!dataObject.trim()) {
					return true;
				}
				return false;
			} else if (typeof (dataObject) === 'undefined') {
				return true;
			} else {
				return false;
			}
		},

		/**
		 * This class initalize the validation for the inputs, datepicker, select.
		 * @class
		 * @example
		 * let controlsValidation;
		 * controlsValidation = new this.ControlsValidation(this);
		 * controlsValidation.addControls(['controlID_1','controlID_2', '...']);
		 * controlsValidation.addSubmitButton('CHANGE_TO_YOUR_OWN_SUBMIT_BUTTON_ID');
		 * 
		 * controlsValidation.validateFields();
		 * 
		 * controlsValidation.bundleSubmitButtonEnablement();
		 */

		ControlsValidation: class {
			// PRIVATE _userControls = [];

			constructor(currentContext) {
				/**
				 * @property {Array} invalidFields The invalid inputs, datepickers, select which are empty
				 */
				this.invalidFields = [];

				/**
				 * @property {Array} userControls The control IDs which needs to be validated
				 */
				this.userControls = [];

				/**
				 * @property {String} submitButton The control ID for the submit button 
				 */
				this.submitButton = null;

				/**
				 * @property {Object} currentContext The 'this' of the current view
				 */
				this.viewContext = currentContext;
			}

			/**
			 * This gets from an Array the IDs and checks them if the controls are present and adds them into an array for later use.
			 * @param    {controls}
			 * @memberof ControlsValidation
			 * @method
			 */

			addControls(controls) {
				if (typeof controls === 'object' && Array.isArray(controls)) {
					controls.forEach(function (controlID) {
						const CONTROL_ELEMENT = this.viewContext.getViewControlByID(controlID);

						if (CONTROL_ELEMENT) {
							this.userControls.push(CONTROL_ELEMENT);
						}
					}, this);
				}
			}

			/**
			 * This method adds the submit button
			 * @method
			 * @param    {controls}
			 * @memberof ControlsValidation
			 */

			addSubmitButton(buttonID) {
				let submitButton = this.viewContext.getViewControlByID(buttonID);

				if (submitButton)
					this.submitButton = submitButton;

			}

			/**
			 * This methods checks the validation and sets the submit button to enabled otherwise the submit button is not enabled
			 * @method
			 * @memberof ControlsValidation
			 */

			bundleSubmitButtonEnable(isEnabled) {
				if (this.invalidFields.length === 0)
					this.submitButton.setEnabled(true);
				else
					this.submitButton.setEnabled(false);
			}

			/**
			* This method validates the Inputs, Select, DatePicker by checking their emptines. In case a UI Element is empty then a VALUE_STATE.ERROR will be set
			  otherwise VALUE_STATE.NONE.
			* @method
			* @memberof ControlsValidation
			*/

			validateFields() {
				const VALUE_STATES = {
					NONE: sap.ui.core.ValueState.None,
					ERROR: sap.ui.core.ValueState.Error
				};

				this.userControls.forEach(function (userControl) {
					const FIELD_TYPE = userControl.getMetadata()._sClassName;

					switch (FIELD_TYPE) {
					case 'sap.m.Select':
						if (userControl.getSelectedItem() === null) {
							userControl.setValueState(VALUE_STATES.ERROR);

							this.invalidFields.push(userControl);
						} else
						if (this.viewContext.isEmpty(userControl.getSelectedItem().getKey()) && this.viewContext.isEmpty(userControl.getSelectedItem()
								.getText())) {
							userControl.setValueState(VALUE_STATES.ERROR);

							this.invalidFields.push(userControl);
						} else
							userControl.setValueState(VALUE_STATES.NONE);

						break;

					case 'sap.m.DatePicker':
						if (this.viewContext.isEmpty(userControl._getInputValue())) {
							userControl.setValueState(VALUE_STATES.ERROR);

							this.invalidFields.push(userControl);
						} else
							userControl.setValueState(VALUE_STATES.NONE);

						break;

					case 'sap.m.TextArea':
					case 'sap.m.Input':
						if (this.viewContext.isEmpty(userControl.getValue())) {
							userControl.setValueState(VALUE_STATES.ERROR);

							this.invalidFields.push(userControl);
						} else
							userControl.setValueState(VALUE_STATES.NONE);

						break;

					}

				}, this);
			}
		},

		/**
		 * This class initalize the validation for the inputs, datepicker, select.
		 * @class
		 * @example
		 * let tableItems = this.byId('CHANGE_TO_YOUR_OWN_TABLE_ID').getItems(), 
		 *     tableValidation = this.tableValidation();
		 * 
		 * let tableValidationClass = new this.TableValidation(this);
		 * 
		 * if(tableValidationClass.isTableNotEmpty(tableItems)) {
		 *      tableValidationClass.addTableLines(tableItems);
		 *      tableValidation.addSubmitButton('SUBMIT_BUTTON_ID');
		 *  
		 *      tableValidation.validateFields();
		 * 
		 *      tableValidation.checkSubmitButtonEnablement();
		 * }
		 */

		TableValidation: function () {
			/**
			 * Class for validation of table fields
			 * @class
			 * @extends ControlsValidation
			 */

			return class initalizeTableFields extends this.ControlsValidation {
				constructor(viewContext) {
					super(viewContext);

					this.tableLines = [];
				}

				/**
				 * This method adds the table items
				 * @method
				 * @param    {Object} items     Items of the table
				 * @memberof TableValidation
				 */

				addTableLines(items) {
					items.forEach(function (line) {
						this.tableLines.push(line);
					}, this);

					this._addMandatoryTableCells();
				}

				/**
				 * This method adds the table items
				 * @method
				 * @param    {Object} tableItems     Items of the table
				 * @memberof TableValidation
				 * @static
				 */

				isTableNotEmpty(tableItems) {
					if (tableItems.length > 0)
						return true;

					return false;
				}

				/**
				 * This method add the mandatory table cells; Note tableCells[...] should be changed accordingly to your cells
				 * @method
				 * @memberof TableValidation
				 * @private
				 */

				_addMandatoryTableCells() {
					this.tableLines.forEach(function (item) {
						let tableCells = item.getAggregation('cells');

						this.userControls.push(tableCells[3]); // THIS COLUMN IS MARKED AS MANDATORY
						this.userControls.push(tableCells[5]); // THIS COLUMN IS MARKED AS MANDATORY
						this.userControls.push(tableCells[6]); // THIS COLUMN IS MARKED AS MANDATORY
						this.userControls.push(tableCells[9]); // THIS COLUMN IS MARKED AS MANDATORY

						// IF the number of the colums is changed / rearenged the index of the columns is also changed
					}, this);
				}
			};
		},

		toggleControlEnable: function (buttonID, isEnabled) {
			if (this.getViewControlByID(buttonID))
				this.getViewControlByID(buttonID).setEnabled(isEnabled);
		},

		/**
		 * This method creates a message toast
		 * @param messageToast 								{String} The message to be showed
		 * @param mOptions 									{Object} Toast properties mOptions? can be found on https://sapui5.hana.ondemand.com/#/api/sap.m.MessageToast. This parameter has a default duration of 2 seconds and width of 10 rem. 
		 * @example 
		 * this.showMessageToast('MESSAGE_TOAST_TO_BE_REPLACED', { toastDuration: 3000, toastWidth: '15rem' })
		 */

		showMessageToast: function (messageToast, {
			toastDuration = 2000,
			toastWidth = '10rem'
		}) {
			sap.m.MessageToast.show(messageToast, {
				duration: toastDuration,
				width: toastWidth
			});
		},

		/**
		 * This method creates an attachment header needed for upload.
		 * This method should be used inside of uploadCollection control -> change event -> event.getSource().addParameter(this._buildAttachmentHeader('X-Requested-With', 'XMLHttpRequest'));
		 * @param keyHeaderName 			{String} Key of the header
		 * @param valueHeaderName 			{String} Value of the header
		 * @example 
		 * this.buildAttachmentHeader('X-Requested-With', 'XMLHttpRequest');
		 * this.buildAttachmentHeader('slug', 'NAME_OF_THE_FILE');
		 */

		buildAttachmentHeader: function (keyHeaderName, valueHeaderName) {
			if (this.isEmpty(keyHeaderName) === false && this.isEmpty(valueHeaderName) === false) {
				return new sap.m.UploadCollectionParameter({
					name: keyHeaderName,
					value: valueHeaderName
				});
			}
		},

		/**
		 * This method will help the user to search over desired binding fields
		 * 
		 * @param event 			{Object}	liveChange, search event
		 * @param bindingFields 	{Array} 	An Array with the binding fields from the model 
		 * @example 
		 * 
		 * XML VIEW USAGE : 
		 * liveChange="searchBy($event, ['TEXT_BINDING_1', 'TEXT_BINDING_2', 'TEXT_BINDING_3'])"
		 * 
		 * CONTROLLER USAGE : 
		 * searchBy : function(event, bindingFields) {
		 *   this.searchByBindingFields(event, bindingFields);
		 * }
		 * 
		 *
		 */

		searchByBindingFields: function (event, bindingFields) {
			const AND_LOGICAL_CONJUNCTION = true;

			let filterByMultipleFileds = new sap.ui.model.Filter({
				filters: [
					this.buildFilters(event.getParameter('value'), bindingFields)
				],
				and: AND_LOGICAL_CONJUNCTION
			});

			event.getSource().getBinding('items').filter(filterByMultipleFileds, sap.ui.model.FilterType.Application);
		},

		/**
		 * This method builds filter based bindingFields
		 * 
		 * @param query 			{String}	Text over should do the filtering
		 * @param bindingFields 	{Array} 	An array of binding fields
		 * @returns 				{Array}		An array of sap.ui.model.Filter
		 * @example 
		 * CONTROLLER USAGE : 
		 * 
		 *   this.buildFilters('A_TEXT_AFTER_THE_SEARCH_SHOULD_DO', ['BINDING_FIELD_1', 'BINDING_FIELD_2', '...']);
		 * 
		 */
		buildFilters: function (query, bindingFields) {
			if (Array.isArray(bindingFields)) {

				const OR_LOGICAL_CONJUNCTION = false,
					typedQuery = query;

				let createdFiltersFromBindingFields = [];

				bindingFields.forEach((bindingName) => {
					let newFilter = new sap.ui.model.Filter(bindingName, sap.ui.model.FilterOperator.Contains, typedQuery);

					createdFiltersFromBindingFields.push(newFilter);
				});

				return new sap.ui.model.Filter({
					filters: createdFiltersFromBindingFields,
					and: OR_LOGICAL_CONJUNCTION
				});
			} else
				this.messageBox.showErrorMessage(`${bindingFields} is not an Array`);
		},

		/**
		 * This method returns the control inside a fragment. 
		 * 
		 * @param fragmentID 					{String}	The fragment name 
		 * @param targetControlIDFromFragment 	{String} 	The control ID from the fragment
		 * @returns								{Object}	Returns the control which was found inside the fragment
		 * @example 
		 * 
		 * CONTROLLER USAGE : 
		 * this.getFragmentControlByID('THE_FRAGMENT_ID','THE_CONTROL_INSIDE_THE_FRAGMENT_ID');
		 * where 'THE_FRAGMENT_ID' is for example : 'sapui5.smart.view.fragments.SalesOrder' => SalesOrder
		 */

		getFragmentControlByID: function (fragmentID, targetControlIDFromFragment) {
			let assertionControl = sap.ui.require('sap/base/assert');

			if (sap.ui.core.Fragment.byId(fragmentID, targetControlIDFromFragment))
				return sap.ui.core.Fragment.byId(fragmentID, targetControlIDFromFragment);
			else
				assertionControl(false, `Control with ID - ${targetControlIDFromFragment} does not exists for fragment with name ${fragmentID}`);
		},

		/**
		 * This method add leading zeros to the target text
		 * 
		 * @param targetText 					{String}	Target text to add the leading zeros
		 * @param maxLenght 					{String} 	The maxmimum length of the text 
		 * @example 
		 * this.addLeadingZeros('LEADING_ZEROS_TARGET_TEXT', 30);
		 * @returns								{String} 	The text with the added leading zeros otherwise empty string.
		 * 
		 */

		addLeadingZeros: function (targetText, maxLength) {
			if (this.isEmpty(targetText) === false)
				return targetText.padStart(maxLength, '0');

			return '';
		},

		/**
		 * This class is a helper for the .create .read .update .remove sap.ui.model.odata.v2.ODataModel
		 * @class
		 * @example
		 *	
		 * const odataEntities = {
		 *   oDataServiceModel: this.getOwnerComponentModel('MEMWF_SRV'), // MANDATORY ENTITY
		 *   entitySet: this.constants.ODATA.REFERENCE_NUMBER_ENTITY, // MANDATORY ENTITY
		 *   filters: sap.ui.model.Filter[], // NOT MANDATORY
		 *   currentView: this.getView(), // MANDATORY ENTITY
		 *   successCallback : function(responseData) { // MANDATORY ENTITY
		 *	  let currentControllerContext = this;
		 *	  // currentControllerContext. ...
		 *    // HERE YOU HANDLE THE DATA
		 *	 }
		 * };
		 * 
		 * let newRequest = new this.RequestInitialization();
		 * newRequest.setEntities(odataEntities);
		 * newRequest.doRequest('read');
		 */

		RequestInitialization: class {

			constructor() {
				this._odataEntities = {};
				/**
				 * @property {Object}						_odataEntities						Object should contain the mandatory and optional properties for the call of the OData (See example of usage)
				 * @property {Object}						_odataEntities.oDataServiceModel	Object should contain the ODataModel of type sap.ui.model.odata.v2.ODataModel.
				 * @property {String}						_odataEntities.entitySet			String should contain the Entity Set to which point the WebService. 
				 * @property {String}						_odataEntities.data					In case the .create method is used then data is mandatory for creation of the fields in the backend.
				 * @property {Object}						_odataEntities.currentView			Object should contain the Current View from where the function is called.
				 * @property {Function}						_odataEntities.successCallback		Function should contain success callback where the data should be handled.
				 * @property {sap.ui.model.Sorter[]}		_odataEntities.sorters				Map should contain success callback where the data should be handled.
				 * @property {sap.ui.model.Filter[]}		_odataEntities.filters				Map should contain success callback where the data should be handled.
				 */

				this._busyDialog = new sap.m.BusyDialog({
					busyIndicatorDelay: 2000,
					busyIndicatorSize: sap.ui.core.BusyIndicatorSize.Auto
				});
			}

			/*
			 * @private
			 * @memberof RequestInitialization
			 * @method
			 */

			_checkEntities(entities) {
				let optionalUrlODataParameters = new Map(),
					mandatoryODataEntities = {},
					postingData = {},
					odataBaseFilters = {},
					odataBaseSorters = {};

				if (entities.hasOwnProperty('filters')) {
					if (Array.isArray(entities.filters))
						odataBaseFilters['filters'] = entities.filters;
					else
						odataBaseFilters['filters'] = [entities.filters];
				}

				if (entities.hasOwnProperty('sorters'))
					if (Array.isArray(entities.sorters))
						odataBaseSorters['sorters'] = entities.sorters;
					else
						odataBaseSorters['sorters'] = [entities.sorters];

				if (entities.hasOwnProperty('select'))
					optionalUrlODataParameters.set('$select', entities.select);

				if (entities.hasOwnProperty('expand'))
					optionalUrlODataParameters.set('$expand', entities.expand);

				if (entities.hasOwnProperty('paginationTop'))
					optionalUrlODataParameters.set('$top', entities.top);

				if (entities.hasOwnProperty('skipPagination'))
					optionalUrlODataParameters.set('$skip', entities.skip);

				if (entities.hasOwnProperty('data'))
					postingData['data'] = entities.data;

				if (entities.hasOwnProperty('currentView')) {
					mandatoryODataEntities['currentView'] = entities.currentView;
					mandatoryODataEntities['currentControllerContext'] = entities.currentView.getController();
				}

				if (entities.hasOwnProperty('oDataServiceModel')) {
					mandatoryODataEntities['oDataServiceModel'] = entities.oDataServiceModel;

					this._attachBusyStateEvents.call(mandatoryODataEntities['oDataServiceModel'], this._busyDialog);
				}

				if (entities.hasOwnProperty('entitySet'))
					mandatoryODataEntities['entitySet'] = `/${entities.entitySet}`;

				if (entities.hasOwnProperty('successCallback'))
					mandatoryODataEntities['successCallback'] = entities.successCallback;

				this._odataEntities = {
					...mandatoryODataEntities,
					...optionalUrlODataParameters,
					...postingData,
					...odataBaseSorters,
					...odataBaseFilters
				};
			}

			setEntities(entities) {
				this._checkEntities(entities);
			}

			_showErrorMessage(errorResponse) {
				this._odataEntities.currentControllerContext.messageBox.showErrorMessage(`${errorResponse.message}`,
					`${errorResponse.responseText}`);
			}

			_attachBusyStateEvents(busyDialog) {
				this.attachEventOnce('requestSent', () => {
					busyDialog.open();
				});

				this.attachEventOnce('requestCompleted', () => {
					busyDialog.close();
				});
			}

			_buildReadRequest() {
				let that = this;

				return new Promise(function (resolve, reject) {

					that._odataEntities.oDataServiceModel.read(that._odataEntities.entitySet, {
						success: function (result) {
							resolve(result);
						},
						error: function (errorResponse) {
							reject(errorResponse);
						},
						urlParameters: that._odataEntities.optionalUrlParameters,
						filters: that._odataEntities.filters,
						sorter: that._odataEntities.sorters
					});
				});
			}

			_buildSaveRecordRequest(requestType) {
				let that = this;

				return new Promise(function (resolve, reject) {
					that._odataEntities.oDataServiceModel[requestType](that._odataEntities.entitySet, that._odataEntities.data, {
						success: function (result) {
							resolve(result);
						},
						error: function (errorResponse) {
							reject(errorResponse);
						},
						urlParameters: that._odataEntities.optionalUrlParameters,
						refreshAfterChange: true
					});
				});
			}

			_buildDeleteRequest() {
				let that = this;

				return new Promise(function (resolve, reject) {
					that._odataEntities.oDataServiceModel.remove(that._odataEntities.entitySet, {
						success: function (result) {
							resolve(result);
						},
						error: function (errorResponse) {
							reject(errorResponse);
						},
						urlParameters: that._odataEntities.optionalUrlParameters,
						refreshAfterChange: true
					});
				});
			}

			_whichRequestTypeIs(requestType) {
				const REQUEST_TYPE = {
						READ: 'read',
						CREATE: 'create',
						UPDATE: 'update',
						DELETE: 'delete'
					},
					ERROR_MESSAGE = 'Request type must be added as a parameter to doRequest function';

				if (requestType === REQUEST_TYPE.READ)
					return this._buildReadRequest();
				else
				if (requestType === REQUEST_TYPE.CREATE || requestType === REQUEST_TYPE.UPDATE)
					return this._buildSaveRecordRequest(requestType);
				else
				if (requestType === REQUEST_TYPE.DELETE)
					return this._buildDeleteRequest();

				this._odataEntities.currentControllerContext.messageBox.showErrorMessage(ERROR_MESSAGE);

				return;
			}

			/**
			 * This method creates a Promise and perform the .read .create .update .delete operation.
			 * 
			 * @memberof RequestInitialization
			 * @param		{String}	requestType This parameter is mandatory to be provided and has the following values : 'read', 'create', 'update', 'delete'
			 * @method
			 * @example .doRequest('read'); .doRequest('create'); .doRequest('update'); .doRequest('delete'); 
			 */

			doRequest(requestType) {
				let that = this;

				(async() => {
					try {
						const promiseResponse = await that._whichRequestTypeIs(requestType);

						that._odataEntities.successCallback.call(that._odataEntities.currentControllerContext, promiseResponse);

					} catch (errorResponse) {
						that._showErrorMessage(errorResponse);
					}
				})();
			}
		},

		/**
		 * This class let you to enable the suggestion feature. suggestionTargetModel should be already created.
		 * 
		 * @class
		 * @example
			let entities = {
				suggestionInputEvent: inputEvent,
				suggestionTargetModel: 'tableModel>/generalLedgetAccountCollection',
				bindings: {
					rows: [
						'{tableModel>Kstar}',
						'{tableModel>Ltext}'
					],
					columns: [
						{
							text : this.getText('SFH1.OVERVIEW.TABLE.GLACCOUNT_LABEL_ID'),
							width : '10%'
						},
						{
							text : this.getText('SFH1.OVERVIEW.TABLE.GLACCOUNT_LABEL_TEXT'),
							width : 'auto'
						}
					]
				},
				controllerContext: this
			}

			let initalizeSuggestion = new this.InitializeSuggestion(entities);
				initalizeSuggestion.startSuggestion();
				
		 */

		InitializeSuggestion: class {
			constructor(entities) {

				/**
				 * @property {Object}		entities						Object should contain the suggestion entities
				 * @property {Object}		entities.suggestionInputEvent	Event of the input from where the suggestion is called
				 * @property {String}		entities.suggestionTargetModel	The collection of the suggestions
				 * @property {Array}		entities.bindings.rows			An array with the bindings of the fields
				 * @property {Array}		entities.bindings.columns		An array of objects with text of the columns and the width
				 * @property {Object}		entities.bindings.columns.text	Text of the column
				 * @property {Object}		entities.bindings.columns.width	Width of the column
				 * @property {Object}		entities.controllerContext		The current controller context from where class is initalized
				 */

				this.entities = {
					suggestionInputEvent: entities.suggestionInputEvent,
					suggestionTargetModel: entities.suggestionTargetModel,
					bindings: {
						rows: entities.bindings.rows,
						columns: entities.bindings.columns
					},
					controllerContext: entities.controllerContext
				}

				this._suggestionFilters = null;

			}

			_buildFilters() {
				let constructedBindingNameList = [];

				this.entities.bindings.rows.forEach(function (bindingPath) {
					constructedBindingNameList.push(this._constructFilterBindingPath(bindingPath));
				}, this);

				this._suggestionFilters = this.entities.controllerContext.buildFilters(this.getInputValue(), constructedBindingNameList);

			}

			_buildColumns() {
				this.entities.bindings.columns.forEach(function (column) {
					let newColumn = new sap.m.Column({
						width: column.width,
						header: new sap.m.Label({
							text: column.text,
							wrapping: true,
							wrappingType: sap.m.WrappingType.Hyphenated
						})
					})

					this.entities.suggestionInputEvent.getSource().addSuggestionColumn(newColumn);
				}, this);

			}

			getInputValue() {
				let that = this,
					suggestedValue = this.entities.suggestionInputEvent.getParameter('suggestValue');

				if (suggestedValue)
					return suggestedValue;

				return false;
			}

			_correctWidthRowsWhenDevice(width) {
				let columnsFullWidth = (this._rowPercentageWhenDevice() * this.entities.bindings.rows.length); // 5 or 15 multiplied with rows number

				this.entities.suggestionInputEvent.getSource().setMaxSuggestionWidth(`${columnsFullWidth.toString()}%`);
			}

			_rowPercentageWhenDevice() {
				let columnWidthLength = 0;

				if (this.entities.controllerContext.getDevice.isDesktop())
					columnWidthLength = 15; // on desktop set to 15%
				else if (this.entities.controllerContext.getDevice.isTablet())
					columnWidthLength = 35; // on tablet, mobile set to 30%

				return columnWidthLength;
			}

			_buildRows() {
				let columnTemplate = new sap.m.ColumnListItem();

				this.entities.bindings.rows.forEach(function (bindingRow) {

					let labelColumn = new sap.m.Label({
						text: bindingRow,
						wrapping: true,
						wrappingType: sap.m.WrappingType.Hyphenated
					});

					columnTemplate.addCell(labelColumn);

				}, this);

				this.entities.suggestionInputEvent.getSource().bindAggregation('suggestionRows', {
					path: this.entities.suggestionTargetModel,
					template: columnTemplate,
					templateShareable: false // NOTE : When unbindAggregation is called the __template__ is destroyed.
				});
			}

			isPopupNotBuilded() {
				const inputSource = this.entities.suggestionInputEvent.getSource();

				if (inputSource._hasTabularSuggestions() === false)
					return true;

			}

			removeTabularSuggestions() {
				const inputSource = this.entities.suggestionInputEvent.getSource();

				inputSource.removeAllSuggestionColumns();
				inputSource.removeAllSuggestionRows();
				inputSource.unbindAggregation('suggestionRows');

			}

			_validateSuggestionField() {
				let inputSource = this.entities.suggestionInputEvent.getSource();

				if (inputSource.getBinding('suggestionRows').getLength() > 0)
					inputSource.setValueState('None');
				else
					inputSource.setValueState('Error');
			}

			/**
			 * This method is fired after the popup is closed 
			 * @public
			 * @memberof InitializeSuggestion
			 * @method
			 */

			onPopupClose() {

				/*	let tabularPopup = this.entities.suggestionInputEvent.getSource()._getSuggestionsPopover()._oPopover;

					tabularPopup.attachEventOnce('afterClose', function (event) {
						// TODO ADD THE FUNCTION 
					}.bind(this));
				*/

			}

			_doFiltering() {
				this.entities.suggestionInputEvent.getSource().getBinding('suggestionRows').filter(this._suggestionFilters, sap.ui.model.FilterType
					.Application);
			}

			/**
			 * This method starts the suggestion list
			 * @public 
			 * @memberof InitializeSuggestion
			 * @method
			 */

			startSuggestion() {
				if (this.getInputValue()) {

					if (this.isPopupNotBuilded()) {
						this._correctWidthRowsWhenDevice();

						this._buildColumns();
						this._buildRows();
					}

					this._buildFilters();
					this._doFiltering();

					this._validateSuggestionField();

				}
			}

			_constructFilterBindingPath(bindingPath) {
				if (this.entities.controllerContext.isEmpty(bindingPath) === false) {

					if (bindingPath.lastIndexOf('>') !== -1)
						return bindingPath.slice(bindingPath.lastIndexOf('>') + 1).replace('}', '');
					else
						return bindingPath.replace('{', '').replace('}', '');

				}
			}

		},

		/**
		 * This method allows you to uppercase as you type 
		 * @method
		 * @example
		 * in VIEW
		 * <Input liveChange="uppercaseAsIsTyped" ...
		 * 
		 * in CONTROLLER
		 * this.uppercaseAsIsTyped(typedValue);
		 * 
		 */

		uppercaseAsIsTyped: function (typedValueEvent) {

			let inputSource = typedValueEvent.getSource();

			if (this.isEmpty(inputSource.getValue()) === false)
				inputSource.setValue(inputSource.getValue().toUpperCase());
		},

		/**
		 * This class let you to clean all the inputs provided as Array.
		 * 
		 * @class
		 * @example
			let entities = {
				arrayInputs : ['ID_1','ID_2','ID_3'],
				controllerContext : this
			};
			
			let cleanInputClass = new this.cleanInputs(entities);
				cleanInputClass.cleanAllControls();
		*/
		
		cleanInputs: class {
			constructor(entities) {
				/**
				 * @property {Object}		entities						Object should contain the inputs array and the context of the controller
				 * @property {Object}		entities.arrayInputs			Object should contain the inputs array
				 * @property {Object}		entities.controllerContext		Object should contain the 'this' of the controller
				 */
				 
				this.entities = {
					arrayInputs : entities.arrayControls,
					controllerContext : entities.controllerContext
				}
			}

			_isArrayNotEmpty() {
				if (Array.isArray(this.inputsArray))
					return true;

				return false;
			}

			_cleanByControlType(item) {
				let getControl = this.entities.controllerContext.getViewControlByID(item),
					controlType = getControl.getMetadata()._sClassName;

				switch (controlType) {
				case 'sap.m.Input':
					if (getControl.getValue !== '')
						getControl.setValue('');

					if (getControl.getDescription !== '')
						getControl.setDescription('');

					break;

				case 'sap.m.Select':
					if (getControl._getSelectedItemText() !== '')
						getControl.setSelectedKey('');

					break;

				case 'sap.m.UploadCollection':
					if (getControl.getItems().length !== 0) {
						getControl.removeAllItems();
						getControl.destroyItems();
					}
					
					break;
				}
			}
			
			/**
			 * This method cleans all the inputs provided as Array
			 * @public 
			 * @memberof cleanInputs
			 * @method
			 */
			 
			cleanAllControls() {
				if (this._isArrayNotEmpty(this.inputsArray))
					this.entities.arrayInputs.forEach(this._cleanByControlType);
			}
		}
	});
});