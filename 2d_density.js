function createTwoDDensityPlot() {
    // Set up dimensions and margins
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    // Clear any existing SVG
    d3.select("#twod-density-plot").html("");

    // Create SVG element
    const svg = d3.select("#twod-density-plot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Load and process data
    d3.csv("data/agg_keystroke.csv").then(function (data) {
        // Convert string values to numbers
        data.forEach(d => {
            d.delay = +d.delay;
            d.duration = +d.duration;
            d.has_parkinsons = d.has_parkinsons === "True";
        });

        // Split data by has_parkinsons
        const parkinsons = data.filter(d => d.has_parkinsons);
        const control = data.filter(d => !d.has_parkinsons);

        // Set up scales
        const x = d3.scaleLinear()
            .domain([0, 0.6])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, 0.2])
            .range([height, 0]);

        // Add X axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .append("text")
            .attr("fill", "#000")
            .attr("x", width / 2)
            .attr("y", margin.bottom - 10)
            .attr("text-anchor", "middle")
            .text("Delay (seconds)");

        // Add Y axis
        svg.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("fill", "#000")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 15)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .text("Duration (seconds)");

        // Function to create contours for each group
        function createContours(data, color) {
            // Create density estimation
            const densityData = d3.contourDensity()
                .x(d => x(d.delay))
                .y(d => y(d.duration))
                .size([width, height])
                .bandwidth(30)
                .thresholds(10)
                (data);

            // Add contours
            svg.append("g")
                .selectAll("path")
                .data(densityData)
                .enter()
                .append("path")
                .attr("d", d3.geoPath())
                .attr("fill", color)
                .attr("fill-opacity", d => 0.1 + d.value * 250)
                .attr("stroke", color)
                .attr("stroke-opacity", 1)
                .attr("stroke-width", 0.5);
        }

        // Create contours for each group
        createContours(parkinsons, "#6c63ff");
        createContours(control, "#ffb663");

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width - 120}, ${height - 100})`);

        // Parkinson's legend item
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", "#6c63ff");

        legend.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text("Parkinson's")
            .style("font-size", "12px");

        // Control legend item
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 25)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", "#ffb663");

        legend.append("text")
            .attr("x", 20)
            .attr("y", 37)
            .text("Control")
            .style("font-size", "12px");

        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Duration vs. Delay Density Plot");
    });
}

// Initialize the plot when the page loads
document.addEventListener('DOMContentLoaded', function () {
    createTwoDDensityPlot();
});