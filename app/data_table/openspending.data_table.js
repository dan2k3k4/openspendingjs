(function() {
  var $, Column, HTML, _parseResponse,
    __hasProp = Object.prototype.hasOwnProperty;

  $ = OpenSpending.$;

  HTML = "<table class=\"table table-striped table-condensed\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">\n  <thead>\n    <tr></tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td class=\"dataTables_empty\"> Loading data from server&hellip; </td>\n    </tr>\n  </tbody>\n  <tfoot>\n    <tr></tr>\n  </tfoot>\n</table>";

  Column = (function() {

    function Column(spec) {
      this.spec = spec;
      if (typeof this.spec === 'string') {
        this.spec = {
          name: this.spec
        };
      }
      $.extend(this, this.spec);
      if (!(this.data != null)) this.data = this.name;
      if (!(this.name != null)) this.label = '&nbsp;';
      if (!(this.label != null)) this.label = this.name;
    }

    return Column;

  })();

  OpenSpending.DataTable = (function() {

    DataTable.prototype.options = {
      source: '/api/2/search',
      columns: [],
      defaultParams: {}
    };

    function DataTable(element, options) {
      var colspec, _i, _len, _ref;
      this.options = $.extend(true, {}, this.options, options);
      this.element = $(element);
      this.columns = {};
      this.columnOrder = [];
      this.filters = {};
      this.element.html(HTML);
      _ref = this.options.columns;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        colspec = _ref[_i];
        this.addColumn(colspec);
      }
    }

    DataTable.prototype.init = function() {
      var _this = this;
      return this.table = this.element.find('table').dataTable({
        bDestroy: true,
        bProcessing: true,
        bServerSide: true,
        aoColumnDefs: this._columnDefs(),
        aaSorting: this._sorting(),
        sAjaxSource: this.options.source,
        fnServerData: function() {
          return _this._serverData.apply(_this, arguments);
        }
      });
    };

    DataTable.prototype.addColumn = function(colspec) {
      var c;
      c = new Column(colspec);
      this.columns[c.name] = c;
      this.columnOrder.push(c.name);
      this.element.find('thead tr, tfoot tr').append("<td>" + c.label + "</td>");
      return this.element.find('.dataTables_empty').attr('colspan', this.columns.length);
    };

    DataTable.prototype.addFilter = function(key, value) {
      return this.filters[key] = value;
    };

    DataTable.prototype.removeFilter = function(key) {
      return delete this.filters[key];
    };

    DataTable.prototype.redraw = function() {
      return this.table.fnDraw();
    };

    DataTable.prototype._columnDefs = function() {
      var i, name, out, _i, _len, _ref;
      i = 0;
      out = [];
      _ref = this.columnOrder;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        out.push({
          aTargets: [i],
          mDataProp: this.columns[name].data,
          bSortable: this.columns[name].sortable
        });
        i += 1;
      }
      return out;
    };

    DataTable.prototype._sorting = function() {
      var s, _i, _len, _ref, _results;
      _ref = this.options.sorting;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        s = _ref[_i];
        _results.push([this.columnOrder.indexOf(s[0]), s[1]]);
      }
      return _results;
    };

    DataTable.prototype._serverData = function(src, params, callback, conf) {
      var col, dir, i, k, newparams, o, p, rq, v, _i, _len, _ref, _ref2,
        _this = this;
      p = {};
      for (_i = 0, _len = params.length; _i < _len; _i++) {
        o = params[_i];
        p[o.name] = o.value;
      }
      params = p;
      newparams = $.extend(true, {}, this.options.defaultParams);
      newparams.page = (params.iDisplayStart / params.iDisplayLength) + 1;
      newparams.pagesize = params.iDisplayLength;
      newparams.order = [];
      for (i = 0, _ref = params.iSortingCols; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        col = this.columnOrder[params["iSortCol_" + i]];
        dir = params["sSortDir_" + i];
        newparams.order.push("" + col + ":" + dir);
      }
      newparams.order = newparams.order.join("|");
      newparams.filter = [];
      _ref2 = this.filters;
      for (k in _ref2) {
        if (!__hasProp.call(_ref2, k)) continue;
        v = _ref2[k];
        newparams.filter.push("" + k + ":" + v);
      }
      newparams.filter = newparams.filter.join("|");
      newparams.q = params.sSearch;
      rq = $.get(this.options.source, newparams);
      rq.fail(OpenSpending.ajaxError("Source request failed. Params: " + (JSON.stringify(params))));
      rq.then(function(data) {
        $(conf.oInstance).trigger('xhr', conf);
        return callback(_parseResponse(data, params.sEcho));
      });
      return conf.jqXHR = rq;
    };

    return DataTable;

  })();

  _parseResponse = function(data, echo) {
    return {
      sEcho: echo,
      iTotalRecords: data.stats.results_count_query,
      iTotalDisplayRecords: data.stats.results_count_query,
      aaData: data.results
    };
  };

}).call(this);