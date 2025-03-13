const margin = { top: 20, right: 65, bottom: 100, left: 55 },
    width = 600 - margin.left - margin.right,
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

    // Create tooltip div
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "rgba(255, 255, 255, 0.9)")
        .style("border", "1px solid #ddd")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d.updrs108))
        .attr("cy", d => yScale(d.typingSpeed))
        .attr("r", 5)
        .attr("fill", d => colorScale(d))
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1);
            d3.select(event.currentTarget)
                .transition()
                .duration(200)
                .attr("r", 8); // Expand the circle
        })
        .on("mousemove", (event, d) => {
            tooltip.html(`
                <div>UPDRS108: ${d.updrs108}</div>
                <div>Typing Speed: ${d.typingSpeed.toFixed(3)}</div>
            `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", (event, d) => {
            tooltip.style("opacity", 0);
            d3.select(event.currentTarget)
                .transition()
                .duration(200)
                .attr("r", 5); // Shrink the circle back to original size
        });

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40) // Adjusted position for visibility
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .text("UPDRS Rating");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Typing Speed");

});