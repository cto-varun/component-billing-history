"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _antd = require("antd");
var sqrl = _interopRequireWildcard(require("squirrelly"));
require("./styles.css");
var _icons = require("@ant-design/icons");
var _componentMessageBus = require("@ivoyant/component-message-bus");
var _momentTimezone = _interopRequireDefault(require("moment-timezone"));
var _jsPlugin = _interopRequireDefault(require("js-plugin"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
const timezone = 'America/New_York'; // This should ideally come from config
const dataTZ = 'America/Chicago'; // This should ideally come from config
const dateTimeFormat = 'MMM D, YYYY hh:mm:ss a';
const getDateTime = dateTime => {
  let myTime;
  if (dateTime) {
    try {
      const time = (0, _momentTimezone.default)(dateTime) + -1 * new _momentTimezone.default(dateTime).tz(dataTZ).utcOffset() * 60 * 1000;
      myTime = (0, _momentTimezone.default)(time).tz(timezone);
    } catch (e) {}
  }
  if (!myTime) {
    myTime = (0, _momentTimezone.default)();
  }
  return myTime.format(dateTimeFormat);
};
const handleResponse = (successStates, errorStates, setLoading, setDisabled) => (subscriptionId, topic, eventData, closure) => {
  const status = eventData?.value;
  const isSuccess = successStates.includes(status);
  const isFailure = errorStates.includes(status);
  if (isSuccess || isFailure) {
    if (isSuccess) {
      setDisabled(true);
    }
    setLoading(false);
    _componentMessageBus.MessageBus.unsubscribe(subscriptionId);
  }
};
const reverseAdjustment = (record, workflowConfig, datasource) => {
  const {
    adjustmentReversalInfo
  } = record;
  const {
    sequenceNumber,
    amount
  } = adjustmentReversalInfo.reversalAttributes;
  const {
    workflow,
    successStates,
    errorStates,
    submitEvent = 'SUBMIT',
    responseMapping
  } = workflowConfig;
  const [loading, setLoading] = (0, _react.useState)(false);
  const [disabled, setDisabled] = (0, _react.useState)(false);
  const reverseAdjust = () => {
    setLoading(true);
    const registrationId = workflow.concat('.').concat(sequenceNumber);
    _componentMessageBus.MessageBus.subscribe(registrationId, 'WF.'.concat(workflow).concat('.STATE.CHANGE'), handleResponse(successStates, errorStates, setLoading, setDisabled));
    _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.INIT'), {
      header: {
        registrationId: registrationId,
        workflow: workflow,
        eventType: 'INIT'
      }
    });
    _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.').concat(submitEvent), {
      header: {
        registrationId: registrationId,
        workflow: workflow,
        eventType: submitEvent
      },
      body: {
        datasource: datasource,
        request: {
          body: {
            billingAccountNumber: window[window.sessionStorage?.tabId].NEW_BAN,
            freeUserText: '$'.concat(amount).concat(' adjustment reversed.'),
            adjustmentReversalInfo
          }
        },
        responseMapping
      }
    });
  };
  return /*#__PURE__*/_react.default.createElement(_antd.Button, {
    className: "reverse-adjustment-button",
    size: "small",
    type: "text",
    disabled: disabled,
    loading: loading,
    onClick: () => reverseAdjust()
  }, "Reverse");
};
class BillingHistoryComponent extends _react.Component {
  constructor() {
    return super(...arguments), this.state = {
      mainTableData: [],
      error: ''
    }, this.callback = key => {
      this.updateError('');
    }, this.handleOnTabClick = (key, object) => {}, this.getNumberAndIndex = data => {
      let result = [];
      let match = [];

      // 1st getting all the ctn value
      data.forEach((obj, index) => {
        if (!match.includes(obj.ctn)) {
          match.push(obj.ctn);
        }
      });

      // now getting all the index of ctn
      let flag = true;
      match.forEach(value => {
        data.forEach((obj, index) => {
          if (obj.ctn === value && flag) {
            result.push(index);
            flag = false;
          }
        });
        flag = true;
      });
      return result;
    }, this.getNumberStartIndex = string => {
      for (let i = 0; i < string.length; i++) {
        if (Number.isInteger(parseFloat(string[i]))) {
          return i;
        }
      }
      return 0;
    }, this.stringToTwoDecimalPlaces = (string, startIndex) => {
      return string.substring(0, startIndex) + parseFloat(string.substring(startIndex, string.length)).toFixed(2);
    }, this;
  }
  get template() {
    try {
      const {
        template = '',
        configTextObject = {}
      } = this.props.properties;
      const {
        data = [],
        asyncData = [],
        loading = undefined,
        error = undefined
      } = this.props;
      const html = template;
      return sqrl.Render(html, {
        data,
        asyncData,
        configTextObject,
        loading,
        error
      });
    } catch (e) {
      return e.message;
    }
  }
  // eslint-disable-next-line react/sort-comp
  componentDidMount() {
    const {
      props: {
        data: {
          data: {
            billingHistory
          }
        },
        componentId: id
      }
    } = this;
    window[window.sessionStorage?.tabId].handlePdfError = responseData => {
      const errorMessage = responseData?.payload?.causedBy?.[0]?.message;
      this.updateError(errorMessage);
    };
    if (id) {
      window[window.sessionStorage?.tabId][`${id}updateData`] = _ref => {
        let {
          payload
        } = _ref;
        const newData = [];
        for (let i = 0; payload[i]; i += 1) {
          newData.push(payload[i]);
        }
        this.updateData(newData);
      };
    }
    if (billingHistory?.length === 0) {
      if (window[window.sessionStorage?.tabId].sendbillingHistoryAsyncMachine) {
        window[window.sessionStorage?.tabId].sendbillingHistoryAsyncMachine('REFETCH');
      }
    } else {
      this.updateData(billingHistory);
    }
  }
  componentWillUnmount() {
    const {
      props: {
        componentId: id
      }
    } = this;
    if (id) {
      delete window[window.sessionStorage?.tabId][`${id}updateData`];
    }
    if (window[window.sessionStorage?.tabId].handlePdfError) {
      delete window[window.sessionStorage?.tabId].handlePdfError;
    }
  }
  updateError(error) {
    this.setState(prevState => ({
      ...prevState,
      error
    }));
  }
  updateData(data) {
    let addZerobalanceData = [];
    this.setState({
      mainTableData: data && [...data]
    }, () => {
      const {
        mainTableData
      } = this.state;
      addZerobalanceData = mainTableData ? [...mainTableData] : [];
      if (mainTableData && mainTableData[mainTableData.length - 1] && mainTableData[mainTableData.length - 1].monthName !== 'START AT ZERO') {
        const zeroObjectdata = [];
        if (mainTableData) mainTableData.forEach(obj => {
          if (obj.dateTimeBuckets) obj.dateTimeBuckets.forEach(objData => {
            if (objData.zeroBalance === true) {
              zeroObjectdata.push(objData);
            }
          });
        });
        const zeroObject = {
          monthName: 'START AT ZERO',
          active: 'true',
          bridgePay: false,
          suspended: false,
          dateTimeBuckets: [...zeroObjectdata]
        };
        addZerobalanceData.push(zeroObject);
        this.setState({
          mainTableData: [...addZerobalanceData]
        });
      }
    });
  }
  render() {
    const {
      mainTableData,
      error
    } = this.state;
    const {
      properties: {
        reverseAdjFeatureFlag = 'reverseAdjustment',
        workflows = {}
      },
      parentProps: {
        datasources
      }
    } = this.props;
    const __html = this.template;
    let reverseAdjFeature = _jsPlugin.default.invoke('features.evaluate', reverseAdjFeatureFlag)[0];
    const getSecondLevelTable = (ctnLevelData, banLevelData, transactionType) => {
      let showData = this.getNumberAndIndex(ctnLevelData);
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "nested-table"
      }, banLevelData.length > 0 && /*#__PURE__*/_react.default.createElement(_antd.Table, {
        className: "add-styling ctn-table",
        columns: banLevelColumnStructure,
        dataSource: banLevelData.map(e => {
          return {
            ...e,
            transactionType
          };
        }),
        pagination: false
      }), ctnLevelData.length > 0 && /*#__PURE__*/_react.default.createElement(_antd.Table, {
        className: "ctn-table",
        columns: ctnLevelColumnStructure,
        dataSource: ctnLevelData,
        pagination: false,
        rowClassName: (ctnLevelData, index) => {
          return !showData.includes(index) && 'hide-row-data';
        }
      }));
    };
    const tabContent = (data, key, lengthOfMainData) => {
      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
        onClick: () => this.handleOnTabClick(key, data)
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "tab-content"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "tab-content-left"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: data.bridgePay || data.suspended ? 'tab-content-heading month-display-color' : 'tab-content-heading'
      }, data.monthName), data.bridgePay ? /*#__PURE__*/_react.default.createElement(_antd.Tooltip, {
        placement: "top",
        title: 'Bridge Pay'
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "bridge-icon"
      }, /*#__PURE__*/_react.default.createElement("svg", {
        version: "1.0",
        xmlns: "http://www.w3.org/2000/svg",
        width: "16px",
        height: "16px",
        viewBox: "0 0 8000 8000",
        preserveAspectRatio: "xMidYMid meet"
      }, /*#__PURE__*/_react.default.createElement("g", {
        id: "layer101",
        fill: "#3170B7",
        stroke: "none"
      }, /*#__PURE__*/_react.default.createElement("path", {
        d: "M3900 7500 c-8 -5 -24 -10 -34 -10 -39 0 -167 -72 -225 -126 -98 -90 -155 -202 -169 -329 l-7 -59 -60 -12 c-33 -7 -114 -29 -180 -49 -508 -154 -905 -451 -1083 -810 -27 -56 -51 -120 -82 -220 -13 -46 -9 -156 9 -225 38 -141 156 -287 281 -348 66 -33 178 -62 238 -62 64 0 188 32 254 67 83 43 184 146 227 230 17 35 31 68 31 76 0 14 66 80 120 119 79 58 229 125 360 162 226 63 532 69 704 16 33 -11 66 -20 72 -20 7 0 14 30 19 78 27 301 162 626 353 850 31 37 41 56 33 61 -6 4 -59 23 -116 41 l-104 34 -6 56 c-32 279 -263 490 -536 490 -46 0 -91 -5 -99 -10z"
      }), /*#__PURE__*/_react.default.createElement("path", {
        d: "M5785 7014 c-11 -2 -45 -9 -75 -15 -153 -29 -346 -115 -473 -210 -152 -114 -302 -300 -381 -470 -67 -145 -106 -327 -106 -496 0 -574 413 -1070 981 -1178 101 -19 326 -19 431 0 466 82 860 464 957 925 6 30 16 78 22 105 16 73 6 284 -19 393 -54 241 -158 430 -332 604 -180 179 -393 291 -639 333 -76 14 -314 19 -366 9z m234 -686 c71 -145 160 -328 200 -407 39 -78 71 -154 71 -167 l0 -24 -190 0 -190 0 5 -37 c3 -21 16 -132 30 -248 14 -115 30 -249 36 -297 7 -48 9 -94 6 -102 -16 -41 -39 -9 -130 177 -52 105 -143 290 -202 410 -59 120 -104 224 -101 232 4 12 37 15 190 15 l186 0 -5 28 c-3 15 -21 168 -40 341 -34 311 -34 341 -3 341 5 0 67 -118 137 -262z"
      }), /*#__PURE__*/_react.default.createElement("path", {
        d: "M4605 4835 c-155 -114 -407 -210 -780 -299 -488 -117 -943 -333 -1230 -583 -268 -234 -453 -549 -510 -868 -8 -49 -20 -109 -25 -133 -13 -54 -13 -273 -1 -321 5 -20 17 -81 27 -136 62 -367 276 -730 586 -993 187 -158 453 -306 681 -377 l117 -37 0 -72 c0 -132 55 -260 155 -361 65 -66 122 -102 206 -130 30 -10 64 -21 77 -26 73 -28 256 6 359 67 156 91 261 264 266 438 2 62 4 67 27 72 218 50 334 90 505 174 339 165 586 385 779 694 94 149 124 293 92 430 -50 211 -198 361 -403 411 -174 42 -371 -14 -497 -141 -21 -21 -66 -82 -101 -134 -138 -210 -305 -317 -605 -386 -39 -9 -142 -18 -256 -21 -155 -4 -206 -2 -273 11 -315 64 -554 249 -643 499 -18 50 -23 84 -23 173 0 109 1 112 39 187 113 223 424 402 896 517 670 162 1081 358 1402 669 60 57 108 109 108 115 0 6 -30 20 -67 31 -98 27 -222 77 -311 125 -168 90 -361 247 -462 378 -30 39 -59 71 -65 71 -5 -1 -37 -20 -70 -44z"
      }))))) : /*#__PURE__*/_react.default.createElement("div", {
        className: ""
      })
      // <div className="bridge-icon domey-bridge-pay-icon"></div>
      , data.suspended ? /*#__PURE__*/_react.default.createElement(_antd.Tooltip, {
        placement: "top",
        title: 'Suspended Account'
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "suspend-icon"
      })) : /*#__PURE__*/_react.default.createElement("div", {
        className: ""
      })))));
    };
    const mainTable = (data, index, object) => {
      let seqNo = '';
      if (object.billSeqNo) {
        seqNo += object.billSeqNo;
      }
      const dataWithKeys = data?.map((data, index) => {
        return {
          ...data,
          id: index,
          key: index
        };
      });
      return /*#__PURE__*/_react.default.createElement("div", null, object.monthName !== 'NOW' && object.monthName !== 'START AT ZERO' && /*#__PURE__*/_react.default.createElement("button", {
        className: "view-statements-button",
        onClick: () => {
          this.updateError('');
          window[window.sessionStorage?.tabId]['sendviewStatementsAsyncMachine']('APPEND.URL', {
            value: window[window.sessionStorage?.tabId].NEW_BAN
          });
          window[window.sessionStorage?.tabId]['sendviewStatementsAsyncMachine']('APPEND.URL', {
            value: '/'
          });
          window[window.sessionStorage?.tabId]['sendviewStatementsAsyncMachine']('APPEND.URL', {
            value: `${seqNo}`
          });
          window[window.sessionStorage?.tabId]['sendviewStatementsAsyncMachine']('FETCH.PDF');
        }
      }, "View Statement"), error !== '' && /*#__PURE__*/_react.default.createElement("div", {
        className: "billing-history-error-message"
      }, "Error: ", error), /*#__PURE__*/_react.default.createElement("div", {
        className: "header-bottom-styling"
      }), /*#__PURE__*/_react.default.createElement(_antd.Table, {
        className: "main-table",
        columns: columns,
        dataSource: dataWithKeys,
        pagination: false,
        scroll: {
          y: 410
        },
        rowKey: record => record.id,
        expandedRowRender: (record, index) => {
          return /*#__PURE__*/_react.default.createElement("div", {
            className: "hide-icon",
            key: index
          }, getSecondLevelTable(record.ctnTransactions || [], record.banTransactions || [], record.transactionType));
        },
        expandIcon: data => {
          if (data.expanded) {
            return /*#__PURE__*/_react.default.createElement(_icons.CaretDownOutlined, {
              key: data.record.dateTime,
              onClick: e => {
                data.onExpand(data.record, e);
              }
            });
          } else {
            return /*#__PURE__*/_react.default.createElement(_icons.CaretRightOutlined, {
              key: data.record.dateTime,
              onClick: e => {
                data.onExpand(data.record, e);
              }
            });
          }
        }
      }));
    };
    const tabPan = (object, index, lengthOfMainData) => {
      return {
        key: index,
        label: tabContent(object, index, lengthOfMainData),
        children: mainTable(object.dateTimeBuckets, index, object)
      };
    };
    const columns = [{
      title: 'Date',
      dataIndex: 'dateTime',
      key: 'dateTime',
      width: '20%',
      render: text => {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "dateTime"
        }, getDateTime(text));
      }
    }, {
      title: 'Description',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: '20%',
      render: text => {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "type"
        }, " ", text);
      }
    }, {
      title: 'Amount',
      dataIndex: 'amount',
      className: 'billing-history-amount',
      key: 'amount',
      align: 'right',
      render: (text, record, index) => {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "dateTime"
        }, this.stringToTwoDecimalPlaces(text, this.getNumberStartIndex(text)));
      }
    }, {
      dataIndex: 'amount',
      key: 'amount',
      width: '5%',
      render: text => {
        return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null);
      }
    }, {
      dataIndex: 'amount',
      key: 'amount',
      align: 'left',
      width: '15%',
      render: (text, record, index) => {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "dateTime"
        }, record?.transactionType === 'Adjustment' && record?.banTransactions?.find(bt => bt?.adjustmentReversalInfo?.eligibleForReversal === true) && !reverseAdjFeature?.disabled && /*#__PURE__*/_react.default.createElement(_antd.Tag, {
          color: "green"
        }, "Reverse Adj Eligible"));
      }
    }, {
      title: 'Account Balance',
      dataIndex: 'accountBalance',
      className: 'billing-history-accountBalance',
      key: 'accountBalance',
      // width:'18%',
      render: text => {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "dateTime"
        }, this.stringToTwoDecimalPlaces(text, this.getNumberStartIndex(text)));
      }
    }, {
      title: '',
      dataIndex: '',
      className: '',
      key: '',
      width: '8%'
    }];
    const ctnLevelColumnStructure = [{
      title: 'CTN',
      dataIndex: 'ctn',
      key: 'ctn',
      width: '20%',
      className: 'level-one-ctn-column',
      render: text => {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "data-styling-for-ctn-table level-one-ctn-column"
        }, text);
      }
    }, {
      title: 'SOC DESCRIPTION',
      dataIndex: 'description',
      key: 'description',
      width: '35%',
      render: text => {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "data-styling-for-ctn-table"
        }, text);
      }
    }, {
      title: 'AMOUNT',
      // We are not going to show title here
      dataIndex: 'amount',
      key: 'amount',
      width: '20%',
      className: 'billing-history-amount',
      render: text => {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "data-styling-for-ctn-table"
        }, this.stringToTwoDecimalPlaces(text, this.getNumberStartIndex(text)));
      }
    }, {
      title: '',
      // We are not going to show title here
      dataIndex: '',
      key: '',
      width: '25%'
    }];
    const banLevelColumnStructure = [{
      title: '',
      dataIndex: 'description',
      key: 'description',
      width: '55%',
      // className: "level-one-ctn-column",
      render: text => {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "data-styling-for-ctn-table"
        }, text);
      }
    }, {
      title: 'AMOUNT',
      dataIndex: 'amount',
      key: 'amount',
      className: 'billing-history-amount',
      width: '20%',
      render: text => {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "data-styling-for-ctn-table"
        }, this.stringToTwoDecimalPlaces(text, this.getNumberStartIndex(text)));
      }
    }, {
      dataIndex: 'amount',
      key: 'amount',
      className: 'billing-history-amount',
      width: '20%',
      render: (text, record) => {
        return /*#__PURE__*/_react.default.createElement("div", {
          className: "dateTime"
        }, record?.transactionType === 'Adjustment' && record?.adjustmentReversalInfo?.eligibleForReversal === true && !reverseAdjFeature?.disabled && reverseAdjustment(record, workflows.reverseAdjustment, datasources[workflows.reverseAdjustment.datasource]));
      }
    }, {
      title: '',
      // We are not going to show title here
      dataIndex: '',
      key: '',
      width: '25%'
    }];
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "customer-360-billing-history"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "billing-history"
    }, /*#__PURE__*/_react.default.createElement(_antd.Tabs, {
      type: "card",
      defaultActiveKey: "0",
      onChange: this.callback,
      tabPosition: "top",
      animated: false,
      items: mainTableData && mainTableData.map((obj, i) => {
        return tabPan(obj, i, mainTableData.length);
      })
    })), /*#__PURE__*/_react.default.createElement("div", {
      className: "billing-history-component",
      dangerouslySetInnerHTML: {
        __html
      }
    })));
  }
}
exports.default = BillingHistoryComponent;
module.exports = exports.default;