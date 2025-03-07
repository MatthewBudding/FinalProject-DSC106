const margin = {top: 20, right: 50, bottom: 100, left: 80},
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#scatter-plot")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
// Load both CSV files and merge the data
Promise.all([
    d3.csv("data/GT_DataPD_MIT-CS1PD.csv"),
    d3.csv("data/GT_DataPD_MIT-CS2PD.csv")
]).then(([data1, data2]) => {
    const data = [...data1, ...data2]; // Merge the datasets

    data.forEach(d => {
        d.updrs108 = +d.updrs108;
        d.typingSpeed = +d.typingSpeed;
    });

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.updrs108)]) // Start x-axis at 0
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.typingSpeed)]) // Start y-axis at 0
        .range([height, 0]);

    const colorScale = d => d.gt === "True" ? "#6c63ff" : "#ffb663";

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d.updrs108))
        .attr("cy", d => yScale(d.typingSpeed))
        .attr("r", 5)
        .attr("fill", d => colorScale(d))
        .on("mouseover", (event, d) => {
            d3.select("#tooltip")
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("opacity", 1)
                .html(`UPDRS108: ${d.updrs108}<br>Typing Speed: ${d.typingSpeed}`);
        })
        .on("mouseout", () => {
            d3.select("#tooltip").style("opacity", 0);
        });

    d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("opacity", 0);

    svg.append("text")
        .attr("x", width / 2 - 100)
        .attr("y", height + 40) // Adjusted position for visibility
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .text("UPDRS Rating");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -60)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Typing Speed");

});
