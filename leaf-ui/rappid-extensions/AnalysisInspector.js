var AnalysisInspector = Backbone.View.extend({

	className: 'analysis-inspector',
	template: [
		'<label>Analysis</label>',
		'<label class="sub-label">Max Sim Steps</label>',
		'<input id="step-num" class="sub-label" type="number" min="0" max="100" step="1" value="25"/>',
		'<br>',
		'<label class="sub-label">Max Epoch Num</label>',
		'<input id="epoch-num" class="sub-label" type="number" min="0" max="100" value="24"/>',
		'<br>',

		'<label class="sub-label">Select Analysis</label>',
		'<button id="btn-forward-analysis" class="analysis-btns inspector-btn sub-label green-btn">Forward Analysis</button>',
		'<button id="btn-rnd-sim" class="analysis-btns inspector-btn sub-label green-btn">Stochastic Simulation</button>',
		'<button id="btn-simulate" class="analysis-btns inspector-btn sub-label green-btn">Leaf Simulate</button>',
		'<button id="btn-csp" class="analysis-btns inspector-btn sub-label green-btn">CSP Analysis</button>',
		'<button id="btn-csp-history" class="analysis-btns inspector-btn sub-label green-btn">CSP History</button>',
		'<br>',
		'<br>',
		'<button id="load-analysis" class="inspector-btn sub-label red-btn">Load Analysis</button>',
		'<br>',
		'<button id="concatenate-btn" class="inspector-btn sub-label blue-btn">Merge Analyses</button>',
		'<br>',

		'<label>Queries</label>',
		'<h5 id="query-error" class="inspector-error"></h5>',
		'<div id="query-div">',
			'<h5 id="cell1" class="cell-labels"></h5>',
			'<select id="query-cell1" class="query-select relationship-select">',
				'<option class="select-placeholder" selected disabled value="">Select</option>',
			'</select>',
			'<h5 id="cell2" class="cell-labels"></h5>',
			'<select id="query-cell2" class="query-select relationship-select">',
				'<option class="select-placeholder" selected disabled value="">Select</option>',
			'</select>',
			'<button id="clear-query-btn" class="inspector-btn sub-label red-btn">Clear Selected Intentions</button>',
			'<button id="query-btn" class="inspector-btn sub-label blue-btn">Use Selected Intentions</button>',
		'</div>',
	].join(''),

	events: {
		'change select': 'updateCell',
		'click .analysis-btns': 'conductAnalysis',
		'click #load-analysis': 'loadFile',
		'click #concatenate-btn': 'concatenateSlider',
		'click input.delayedprop': 'checkboxHandler',
		'click #query-btn': 'checkQuery',
		'click #clear-query-btn': 'clearQuery'
	},

	render: function(analysisFunctions) {

		// These functions are used to communicate between analysisInspector and Main.js
		this._analysisFunctions = analysisFunctions;
		this.$el.html(_.template(this.template)());

		this.$("#query-cell1").hide();
		this.$("#query-cell2").hide();

		this.$('#btn-csp-history').prop('disabled', 'disabled');
		this.$('#btn-csp-history').css("background","gray");
		this.$('#btn-csp-history').css("box-shadow","none");
	},

	//Call functions specified in main.js
	conductAnalysis: function(e) {

		// limit max and min on step values and epoch values
		var n1 = parseInt(this.$('#step-num').val())
		var n2 = parseInt(this.$('#epoch-num').val());
		if (n1 > 100){
			this.$('#step-num').val("100");
			n1 = "100";
		}else if (n1 < 1){
			this.$('#step-num').val("1");
			n1 = "1";
		}

		if (n2 > 100){
			this.$('#epoch-num').val("100");
			n2 = "100";
		}else if (n2 < 1){
			this.$('#epoch-num').val("1");
			n2 = "1";
		}

		// CSP History enable only if CSP is done
		if(e.currentTarget.id == "btn-csp"){
			this.$('#btn-csp-history').prop('disabled', '');
			this.$('#btn-csp-history').css("background","#27ae60");
			this.$('#btn-csp-history').css("box-shadow","inset 0 -2px #219d55");
		}else{
			this.$('#btn-csp-history').prop('disabled', 'disabled');
			this.$('#btn-csp-history').css("background","gray");
			this.$('#btn-csp-history').css("box-shadow","none");

			// epoch num and step num must be equal to prev CSP
			if(e.currentTarget.id == "btn-csp-history"){
				this.$('#step-num').val(this.prevStepNum);
				this.$('#epoch-num').val(this.prevEpochNum);
				n1 = this.prevStepNum;
				n2 = this.prevEpochNum;
			}
		}

		this.prevStepNum = n1;
		this.prevEpochNum = n2;
		this._analysisFunctions.conductAnalysis(e.currentTarget.id, n1, n2, $("#query-cell1").val(), $("#query-cell2").val());
	},
	loadFile: function(e){
		this._analysisFunctions.loadAnalysisFile();
	},
	concatenateSlider: function(e){
		this._analysisFunctions.concatenateSlider();
	},

	// Queries
	checkQuery: function(e){
		$("#query-cell1").html('<option class="select-placeholder" selected disabled value="">Select</option>');
		$("#query-cell2").html('<option class="select-placeholder" selected disabled value="">Select</option>');

		// Error case
		var cells = this._analysisFunctions.loadQueryObject();
		if (!cells[0] || !cells[1]){
			$("#query-error").text("Please select two intentions");
			this.$("#query-cell1").hide();
			this.$("#query-cell2").hide();
			return
		}

		// Error case
		var funcA = cells[0].model.attr(".funcvalue").text;
		var funcB = cells[1].model.attr(".funcvalue").text;
		var noTimeVariabled = ["R", "C", "I", "D", " "];
		if ((noTimeVariabled.indexOf(funcA) != -1) || (noTimeVariabled.indexOf(funcB) != -1)){
			$("#query-error").text("The constraint type can not be queried");
			this.$("#query-cell1").hide();
			this.$("#query-cell2").hide();
			return
		}

		// Rendering select options
		this.$("#query-cell1").show("fast");
		this.$("#query-cell2").show("fast");
		this.renderSelectOptions(cells[0].model, $("#query-cell1"));
		this.renderSelectOptions(cells[1].model, $("#query-cell2"));

		$("#cell1").text(cells[0].model.attr(".name").text);
		$("#cell2").text(cells[1].model.attr(".name").text);
		$("#query-error").text("");
	},

	// Generating available options from dropdown
	renderSelectOptions: function(cell, select){
		var f = cell.attr(".funcvalue/text");
		var singleVarFuncs = ["RC", "CR", "SD", "DS", "MP", "MN"];

		if(singleVarFuncs.indexOf(f) != -1){
			 select.append($('<option></option>').val("A").html("A"));
			 select.val("A")
		}else if (f == "UD"){
			var begin = cell.attr(".constraints/beginLetter");
			for (var i = 1; i < begin.length; i++)
				select.append($('<option></option>').val(begin[i]).html(begin[i]));
		}
	},

	// Clear selected objects
	clearQuery: function(e){
		this._analysisFunctions.clearQueryObject();
		this.checkQuery();
		$("#query-error").text("");
		$("#cell1").text("");
		$("#cell2").text("");
	},

	//Displays the additional options when delayed propagation is checked.
	checkboxHandler: function(e){
		if (e.currentTarget.checked){
			document.getElementById("hidden").removeAttribute("style");
		}
		else{
			document.getElementById("hidden").setAttribute("style", "display:none");
		}
	},

	clear: function(e){
		this.$el.html('');
	}
});
