function renderLineChart(params) {
  // we want to have animation only on load
  var isFirstLoad = true;
  var isFirstLoadCircle = true;
  // Exposed variables
  var attrs = {
    id: "ID" + Math.floor(Math.random() * 1000000),  // Id for event handlings
    svgWidth: 400,
    svgHeight: 400,
    marginTop: 5,
    marginBottom: 15,
    marginRight: 5,
    marginLeft: 5,
    animationSpeed: 1500,
    spacingAfterchart: 50,
    legendColumnCount: 5,
    legendRowHeight: 40,
    tooltipTextColor: '#C5C5C5',
    tooltipTextFontSize: 12,
    tooltipBackgroundColor: '#222222',
    axisLeftWidth : 30,
    axisBottomHeight : 20,
    container: 'body',
    chartTitle: "",
    data: null
  };


  //InnerFunctions which will update visuals
  var updateData;

  //Main chart object
  var main = function (selection) {
    selection.each(function scope() {

      //Calculated properties
      var calc = {}
      calc.id = "ID" + Math.floor(Math.random() * 1000000);  // id for event handlings
      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;
      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;
      calc.legendHeigh = calc.chartHeight * 0.2;
      calc.lineChartHeight = calc.chartHeight * 0.8;

      calc.legendRowCount = Math.ceil(attrs.data.length / attrs.legendColumnCount);
      calc.eachLegendWidth = calc.chartWidth / attrs.legendColumnCount;

      calc.chartTitleXCoord = (calc.chartWidth - 5 * attrs.chartTitle.length) / 2;

      var line = d3.line()
                  .x(function(d, i) { return x(i); })
                  .y(function(d) { return y(d.value); });
      var max = d3.max(attrs.data, function(d){
        return d3.max(d, function(x){
          return +x.value;
        });
      });

      var firstMonth = attrs.data[0][0];
      var lastMonth = attrs.data[0][attrs.data[0].length - 1];
      
      var dateRange = getDataRange(firstMonth, lastMonth);

      // ############ scales ##############
      var xLabels = d3.scaleTime().domain(dateRange).range([0, calc.chartWidth - attrs.axisLeftWidth * 2]);
      var x = d3.scaleLinear().range([attrs.axisLeftWidth * 2, calc.chartWidth]).domain([0, attrs.data[0].length]),
          y = d3.scaleLinear().range([calc.lineChartHeight - attrs.axisBottomHeight, 0]).domain([0, max]);

      var color = d3.scaleOrdinal(d3.schemeCategory10).domain(attrs.data.map(d => { 
        return d[0].name; 
      }));
      
      // transition
      var t = d3.transition(attrs.id)
                .duration(attrs.animationSpeed)
                .ease(d3.easeLinear)
                .on("start", function(d){ console.log("transiton start") })
                .on("end", function(d){ 
                  console.log("transiton ended");
                  
                  container.selectAll(".dot")
                           .transition(200)
                           .ease(d3.easeLinear)
                           .attr("opacity", 1);
                  
                });

      //Drawing containers
      var container = d3.select(this);
      container.html('');

      //Add svg
      var svg = container.patternify({ tag: 'svg', selector: 'svg-chart-container' })
        .attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight);

      //Add container g element
      var chart = svg.patternify({ tag: 'g', selector: 'chart' })
        .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')');

      // ############# axes ##################
      var xAxis = chart.patternify({ tag: 'g', selector: 'axis axis--x' });

      xAxis.attr("transform", "translate(" + attrs.axisLeftWidth * 2 + "," + (calc.lineChartHeight - attrs.axisBottomHeight) + ")")
          .call(d3.axisBottom(xLabels).tickFormat(d3.timeFormat("%b")).ticks(attrs.data[0].length).tickSize(-calc.lineChartHeight));

      xAxis.selectAll("text")
           .style("text-anchor", "end")
           .attr("dx", "-.18em")
           .attr("dy", "1.15em")
           .attr("transform", function(d) {
               return "rotate(-45)" 
           });

      var yAxis = chart.patternify({ tag: 'g', selector: 'axis axis--y'});

      yAxis.attr("transform", "translate("+attrs.axisLeftWidth+", 0)")
          .call(d3.axisLeft(y).ticks(5).tickSize(-calc.chartWidth)
          .tickPadding(8));

      // ############### lines ############
      var path = chart.patternify({ tag: 'path', selector: 'line', data: attrs.data})
                      .attr("d", d => { return line(d); })
                      .attr("stroke", (d, i) => {
                        return color(d[0].name);
                      })
                      .attr("data-name", d => {
                        return d[0].name;
                      });
           
      // animate if it is first load
      if (isFirstLoad){

        path.attr("stroke-dasharray", function(d){ return this.getTotalLength() })
           .attr("stroke-dashoffset", function(d){ return this.getTotalLength() });
        chart.selectAll(".line").transition(t)
            .attr("stroke-dashoffset", 0);


        isFirstLoad = !isFirstLoad; // turn off animation
      }

      

      // ############## circles ###############
      var circleData = [];
      attrs.data.forEach(x => {
        circleData = circleData.concat(x);
      });

      var tooltip = d3
                      .componentsTooltip()
                      .container(svg)
                      .content([
                        {
                          left: "Name:",
                          right: "{name}"
                        },
                        {
                          left: "Month:",
                          right: "{month}"
                        },
                        {
                          left: "Value:",
                          right: "{value}"
                        }
                      ]);

      var fixeddot = chart.patternify({ tag: 'circle', selector: 'dot', data: circleData })
          .attr("r", 4)
          .attr("cx", function (d, i) {
              return x(i % attrs.data[0].length);
          })
          .attr("cy", function (d) {
              return y(d.value);
          })
          .attr("opacity", () => {
            return isFirstLoadCircle ? 0 : 1;
          })
          .attr("data-name", d => {
            return d.name;
          })
          .style("fill", "#fff")
          .attr("stroke", (d,i) => {
            return color(d.name);
          })
          .attr("stroke-width", 2)
          .on("mouseover", function (d) {
               var circle = d3.select(this);
               circle.style("fill", d => {
                return color(d.name);
               });
               var direction;
               if (d.month === "January") {
                direction = "left";
               }
               else if (d.month === "December") {
                direction = "right";
               }
               else if (+d.value + 100 >= max){
                direction = "top";
               }
               else {
                direction = "bottom";
               }
               tooltip
                    .x(+circle.attr("cx") + 4)
                    .y(+circle.attr("cy"))
                    .direction(direction)
                    .show({ name: d.name, month: d.month, value: d.value});
          })
          .on("mouseout", function(){
            var circle = d3.select(this);
            circle.style("fill", "#fff");

            tooltip.hide();
          });

      var xAxisDescription = chart.patternify({ tag: 'text', selector: 'xAxisDescr' })
                                  .attr("x", calc.chartTitleXCoord)
                                  .attr("y", calc.lineChartHeight + 35)
                                  .text(attrs.chartTitle);

      // ##### legend #####
      var legend = chart.patternify({ tag: 'g', selector: 'legend' })
                        .attr('transform', (d,i) => {
                              return "translate("+ [0, calc.lineChartHeight + attrs.spacingAfterchart] +")"
                        })
                        

      var legend_items = legend.patternify({ 
                                         tag: 'g', 
                                         selector: 'legend_item', 
                                         data: attrs.data.map(d => { 
                                            return d[0].name;
                                         })
                                       })
                                 .attr('transform', function (d, i) {
                                    return "translate(" + (i % attrs.legendColumnCount * calc.eachLegendWidth - 27.5) + "," + Math.floor(i / attrs.legendColumnCount) * attrs.legendRowHeight + ")"
                                  });

      legend_items.append("rect")
              .attr("width", 15)
              .attr("height", 15)
              .attr("x", (d, i) => {
                  return x(i);
              })
              .attr('rx', 2)
              .attr("fill", (d, i) => {
                return color(d);
              })
              .attr("data-selected", "true")
              .on("click", function(d){
                var rect = d3.select(this);
                var isSelected = rect.attr("data-selected");
                var paths = chart.selectAll(".line[data-name='"+ d +"']");
                var dots = chart.selectAll(".dot[data-name='"+ d +"']");
                console.log("path:", path);
                if (isSelected == "true") {
                  rect.style("opacity", 0.5);
                  paths
                    .attr("opacity", 0);
                  dots
                    .attr("opacity", 0);
                  rect.attr("data-selected", "false");
                }
                else{
                  rect.style("opacity", 1);
                  paths
                    .attr("opacity", 1);
                  dots
                    .attr("opacity", 1);
                  rect.attr("data-selected", "true");
                }
                
              });

      legend_items.append("text")
              .attr("x", (d, i) => {
                  return x(i) + 20;
              })
              .attr("stroke", (d, i) => {
                return color(d);
              })
              .attr("stroke-width", 0.9)
              .text(d => {
                return d;
              })
              .attr("transform", "translate("+[0,12]+")");

      // remove circle transition
      isFirstLoadCircle  = false;

      //RESPONSIVENESS
       d3.select(window).on('resize.' + attrs.id, function () {
        setDimensions();
       });

      function setDimensions() {
        var width = container.node().getBoundingClientRect().width;
        main.svgWidth(width);
        container.call(main);
      }

      // Smoothly handle data updating
      updateData = function () {

      }

      //#########################################  UTIL FUNCS ##################################

      function debug() {
        if (attrs.isDebug) {
          //Stringify func
          var stringified = scope + "";

          // Parse variable names
          var groupVariables = stringified
            //Match var x-xx= {};
            .match(/var\s+([\w])+\s*=\s*{\s*}/gi)
            //Match xxx
            .map(d => d.match(/\s+\w*/gi).filter(s => s.trim()))
            //Get xxx
            .map(v => v[0].trim())

          //Assign local variables to the scope
          groupVariables.forEach(v => {
            main['P_' + v] = eval(v)
          })
        }
      }
      debug();
    });
  };

  //----------- PROTOTYEPE FUNCTIONS  ----------------------
  d3.selection.prototype.patternify = function (params) {
    var container = this;
    var selector = params.selector;
    var elementTag = params.tag;
    var data = params.data || [selector];

    // Pattern in action
    var selection = container.selectAll('.' + selector).data(data, (d, i) => {
        if (typeof d === "object") {
            if (d.id) {
                return d.id;
            }
        }
        return i;
    });
    selection.exit().remove();
    selection = selection.enter().append(elementTag).merge(selection)
    selection.attr('class', selector);
    return selection;
  }

  //Dynamic keys functions
  Object.keys(attrs).forEach(key => {
    // Attach variables to main function
    return main[key] = function (_) {
      var string = `attrs['${key}'] = _`;
      if (!arguments.length) { return eval(` attrs['${key}'];`); }
      eval(string);
      return main;
    };
  });

  // data conversion
  function convertData(data) {
      var arr = [];

      Object.keys(data[0]).forEach(x => {
          if (x != "month") {
              var tempArr = [];
              data.forEach(d => {
                  tempArr.push({
                      month: d.month,
                      value: d[x],
                      name: x
                  });
              });
              // some sorting is needed
              arr.push(tempArr);
          }
      });

      return arr;
  }

  //Set attrs as property
  main.attrs = attrs;

  //Debugging visuals
  main.debug = function (isDebug) {
    attrs.isDebug = isDebug;
    if (isDebug) {
      if (!window.charts) window.charts = [];
      window.charts.push(main);
    }
    return main;
  }

  //Exposed update functions
  main.data = function (value) {
    if (!arguments.length) return attrs.data;
    attrs.data = convertData(value);
    if (typeof updateData === 'function') {
      updateData();
    }
    return main;
  }

  // Run  visual
  main.run = function () {
    d3.selectAll(attrs.container).call(main);
    return main;
  }

  return main;
}
