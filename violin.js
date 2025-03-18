/**
 * Creates separate violin plots for duration and delay metrics,
 * comparing Parkinson's and non-Parkinson's patients
 * @param {string} durationSelector - CSS selector for duration plot container
 * @param {string} delaySelector - CSS selector for delay plot container
 * @param {string} dataPath - Path to the CSV file
 */
function createParkinsonsViolinPlots(
    durationSelector = "#duration-violin-plot",
    delaySelector = "#delay-violin-plot",
    dataPath = "data/keystroke_data_nooutliers.csv"
) {
    // Set up SVG dimensions
    const margin = { top: 40, right: 40, bottom: 70, left: 60 };
    const width = 350 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    const totalWidth = width + margin.left + margin.right;
    const totalHeight = height + margin.top + margin.bottom;

    // Clear any existing content
    d3.select(durationSelector).html("");
    d3.select(delaySelector).html("");

    // Create SVG elements
    const durationSvg = d3.select(durationSelector)
        .append("svg")
        .attr("width", totalWidth)
        .attr("height", totalHeight)
        .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
        .style("width", `${totalWidth}px`)
        .style("height", `${totalHeight}px`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const delaySvg = d3.select(delaySelector)
        .append("svg")
        .attr("width", totalWidth)
        .attr("height", totalHeight)
        .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
        .style("width", `${totalWidth}px`)
        .style("height", `${totalHeight}px`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add titles
    durationSvg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Duration");

    delaySvg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Delay");

    // Load and process data
    d3.csv(dataPath).then(function (data) {
        // Convert string values to numbers and seconds to milliseconds
        data.forEach(d => {
            d.duration = +d.duration * 1000; // Convert to milliseconds
            d.delay = +d.delay * 1000;       // Convert to milliseconds
        });

        // Create separate arrays for each category
        const pkDuration = data.filter(d => d.has_parkinsons === "True").map(d => d.duration);
        const nonPkDuration = data.filter(d => d.has_parkinsons === "False").map(d => d.duration);
        const pkDelay = data.filter(d => d.has_parkinsons === "True").map(d => d.delay);
        const nonPkDelay = data.filter(d => d.has_parkinsons === "False").map(d => d.delay);

        // Set up data for the violin plots
        const durationCategories = [
            { name: "Parkinson's", values: pkDuration, color: "#6c63ff" },
            { name: "Non-Parkinson's", values: nonPkDuration, color: "#ffb663" }
        ];

        const delayCategories = [
            { name: "Parkinson's", values: pkDelay, color: "#6c63ff" },
            { name: "Non-Parkinson's", values: nonPkDelay, color: "#ffb663" }
        ];

        // Create the Duration plot
        createViolinWithBoxPlot(
            durationSvg,
            durationCategories,
            width,
            height,
            "Duration (milliseconds)"
        );

        // Create the Delay plot
        createViolinWithBoxPlot(
            delaySvg,
            delayCategories,
            width,
            height,
            "Delay (milliseconds)"
        );
    }).catch(error => {
        console.error("Error loading or processing data:", error);
        // Display error message in both SVGs
        [durationSvg, delaySvg].forEach(svg => {
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .style("fill", "red")
                .text("Error loading data. Check console for details.");
        });
    });
}

/**
 * Creates a violin plot with an embedded box plot
 * @param {Object} svg - D3 selection for the SVG container
 * @param {Array} categories - Data categories to plot
 * @param {number} width - Plot width
 * @param {number} height - Plot height
 * @param {string} yAxisLabel - Label for the y-axis
 */
function createViolinWithBoxPlot(svg, categories, width, height, yAxisLabel) {
    // Find overall min and max for y-scale
    const allValues = [].concat(...categories.map(d => d.values));
    const yMax = d3.max(allValues);

    // Create scales
    const xScale = d3.scaleBand()
        .domain(categories.map(d => d.name))
        .range([0, width])
        .padding(0.05);

    const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .nice()
        .range([height, 0]);

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add Y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -45)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text(yAxisLabel);

    // Function to compute kernel density estimation
    function kernelDensityEstimator(kernel, X) {
        return function (V) {
            return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
        };
    }

    function kernelEpanechnikov(k) {
        return function (v) {
            return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
        };
    }

    // For each category, compute the density and create a violin plot with a box plot inside
    categories.forEach(category => {
        // Skip if no data
        if (category.values.length === 0) {
            console.warn(`No data available for ${category.name}`);
            return;
        }

        // Compute kernel density estimation
        const kde = kernelDensityEstimator(kernelEpanechnikov(7), yScale.ticks(50));
        const density = kde(category.values);

        // Find the maximum density value
        const maxDensity = d3.max(density, d => d[1]) * 2;

        // Create the x-scale for the density (width of the violin)
        const xDensityScale = d3.scaleLinear()
            .domain([-maxDensity, maxDensity])
            .range([0, xScale.bandwidth()]);

        // Create the violin shape
        svg.append("g")
            .attr("transform", `translate(${xScale(category.name)},0)`)
            .append("path")
            .datum(density)
            .style("fill", category.color)
            .style("opacity", 0.9)
            .attr("d", d => {
                return d3.area()
                    .curve(d3.curveCatmullRom)
                    .x0(d => xDensityScale(-d[1]))
                    .x1(d => xDensityScale(d[1]))
                    .y(d => yScale(d[0]))
                    (d);
            });

        // Compute box plot statistics
        const sorted = [...category.values].sort(d3.ascending);
        const q1 = d3.quantile(sorted, 0.25);
        const median = d3.quantile(sorted, 0.5);
        const q3 = d3.quantile(sorted, 0.75);
        const iqr = q3 - q1;
        const min = Math.max(d3.min(sorted), q1 - 1.5 * iqr);
        const max = Math.min(d3.max(sorted), q3 + 1.5 * iqr);

        // Only proceed with values above 0 to ensure box plot doesn't go below x-axis
        const adjustedMin = Math.max(min, 0);

        // Calculate box plot width (make it much smaller) - 25% of original
        const boxWidth = xScale.bandwidth() * 0.125;
        const boxOffset = (xScale.bandwidth() - boxWidth) / 2;

        // Add box for interquartile range (IQR) with transparency
        svg.append("rect")
            .attr("transform", `translate(${xScale(category.name) + boxOffset},0)`)
            .attr("x", 0)
            .attr("y", yScale(q3))
            .attr("width", boxWidth)
            .attr("height", yScale(q1) - yScale(q3))
            .style("fill", "white")
            .style("fill-opacity", 0.3) // Make it transparent
            .style("stroke", "black")
            .style("stroke-width", 0.5); // Thinner borders

        // Add median line
        svg.append("line")
            .attr("transform", `translate(${xScale(category.name) + boxOffset},0)`)
            .attr("x1", 0)
            .attr("x2", boxWidth)
            .attr("y1", yScale(median))
            .attr("y2", yScale(median))
            .style("stroke", "black")
            .style("stroke-width", 1);

        // Add min line (lower whisker) - only if above 0
        if (adjustedMin > 0) {
            svg.append("line")
                .attr("transform", `translate(${xScale(category.name) + boxOffset + boxWidth / 2},0)`)
                .attr("x1", -boxWidth / 4)
                .attr("x2", boxWidth / 4)
                .attr("y1", yScale(adjustedMin))
                .attr("y2", yScale(adjustedMin))
                .style("stroke", "black")
                .style("stroke-width", 0.5);
        }

        // Add max line (upper whisker)
        svg.append("line")
            .attr("transform", `translate(${xScale(category.name) + boxOffset + boxWidth / 2},0)`)
            .attr("x1", -boxWidth / 4)
            .attr("x2", boxWidth / 4)
            .attr("y1", yScale(max))
            .attr("y2", yScale(max))
            .style("stroke", "black")
            .style("stroke-width", 0.5);

        // Add vertical line connecting min-max (only above 0)
        svg.append("line")
            .attr("transform", `translate(${xScale(category.name) + boxOffset + boxWidth / 2},0)`)
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", yScale(adjustedMin))
            .attr("y2", yScale(max))
            .style("stroke", "black")
            .style("stroke-width", 0.5);
    });

    // Add legend
    // const legend = svg.append("g")
    //     .attr("transform", `translate(${width - 160}, ${height + 50})`);

    // categories.forEach((item, i) => {
    //     const legendRow = legend.append("g")
    //         .attr("transform", `translate(0, ${i * 20})`);

    //     legendRow.append("rect")
    //         .attr("width", 15)
    //         .attr("height", 15)
    //         .attr("fill", item.color);

    //     legendRow.append("text")
    //         .attr("x", 20)
    //         .attr("y", 12.5)
    //         .text(item.name)
    //         .style("font-size", "12px");
    // });
}

// Call the function to create both plots
createParkinsonsViolinPlots();