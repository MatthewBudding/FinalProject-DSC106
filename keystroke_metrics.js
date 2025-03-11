function createBarGraph(aggregationFunction = "mean") {
    // Load and process CSV data
    Promise.all([
      d3.csv("data/keystroke_data.csv")
    ]).then(([rawData]) => {
      // Process data to compute required metrics
      const groupedData = d3.group(rawData, d => d.has_parkinsons);
  
      const metrics = Array.from(groupedData, ([hasParkinsons, records]) => {
        const avgHoldTime = aggregationFunction === "mean" ? d3.mean(records, d => +d.duration * 1000) : d3.median(records, d => +d.duration * 1000); // Convert to milliseconds
        const avgFlightTime = aggregationFunction === "mean" ? d3.mean(records, d => +d.delay * 1000) : d3.median(records, d => +d.delay * 1000); // Convert to milliseconds
        return {
          group: hasParkinsons === "True" ? "Parkinson's" : "Non-Parkinson's",
          avgHoldTime,
          avgFlightTime
        };
      });
  
      const data = [
        { metric: "Avg Hold Time (ms)", "Parkinson's": metrics[0].avgHoldTime, "Non-Parkinson's": metrics[1].avgHoldTime },
        { metric: "Avg Delay Time (ms)", "Parkinson's": metrics[0].avgFlightTime, "Non-Parkinson's": metrics[1].avgFlightTime }
      ];
  
      const margin = { top: 40, right: 30, bottom: 50, left: 60 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
  
      d3.select("#dual-bar-plot").selectAll("*").remove(); // Clear the existing chart
  
      const svg = d3.select("#dual-bar-plot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      const x0 = d3.scaleBand()
        .domain(data.map(d => d.metric))
        .range([0, width])
        .padding(0.2);
  
      const x1 = d3.scaleBand()
        .domain(["Parkinson's", "Non-Parkinson's"])
        .range([0, x0.bandwidth()])
        .padding(0.05);
  
      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(d["Parkinson's"], d["Non-Parkinson's"]))])
        .nice()
        .range([height, 0]);
  
      const color = d3.scaleOrdinal()
        .domain(["Parkinson's", "Non-Parkinson's"])
        .range(["#6c63ff", "#ffb663"]); // Updated colors to match the other visualizations
  
      // Tooltip
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "lightsteelblue")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("pointer-events", "none");
  
      svg.append("g")
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x0(d.metric)},0)`)
        .selectAll("rect")
        .data(d => [
          { key: "Parkinson's", value: d["Parkinson's"] },
          { key: "Non-Parkinson's", value: d["Non-Parkinson's"] }
        ])
        .enter()
        .append("rect")
        .attr("x", d => x1(d.key))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => color(d.key))
        .on("mouseover", function (event, d) {
          d3.select(this).attr("opacity", 0.7);
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          tooltip.html(`${d.key}: ${d.value.toFixed(2)} ms`)
            .style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity", 1);
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });
  
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));
  
      svg.append("g")
        .call(d3.axisLeft(y));
  
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Comparison of Typing Metrics in Parkinson's vs. Non-Parkinson's (${aggregationFunction.charAt(0).toUpperCase() + aggregationFunction.slice(1)})`);
  
      const legend = svg.append("g")
        .attr("transform", `translate(${width - 100}, 0)`);
  
      ["Parkinson's", "Non-Parkinson's"].forEach((key, i) => {
        legend.append("rect")
          .attr("x", 0)
          .attr("y", i * 20)
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", color(key))
          .on("click", function () {
            // Toggle visibility of bars
            const isActive = d3.select(this).classed("active");
            d3.select(this).classed("active", !isActive);
            const opacity = isActive ? 1 : 0.2;
            svg.selectAll(`rect[fill="${color(key)}"]`).attr("opacity", opacity);
          });
  
        legend.append("text")
          .attr("x", 20)
          .attr("y", i * 20 + 12)
          .text(key)
          .style("font-size", "12px")
          .attr("alignment-baseline", "middle");
      });
    });
  }
  
  // Call the function to create the bar graph with the default aggregation function (mean)
  createBarGraph();
  
  // Add event listener to the statistic select dropdown
  d3.select("#statistic-select").on("change", function() {
    const selectedOption = d3.select(this).property("value");
    createBarGraph(selectedOption);
  });