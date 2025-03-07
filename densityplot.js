// Density Plot for Typing Speed in Parkinson's and Non-Parkinson's Patients
document.addEventListener('DOMContentLoaded', () => {
    // Get the parent container and its dimensions
    const container = document.querySelector('#density-plot').parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Dynamic margin calculation
    const margin = {
        top: containerHeight * 0.05,
        right: containerWidth * 0.1,
        bottom: containerHeight * 0.25,
        left: containerWidth * 0.05
    };

    // Adjust width and height to fit container
    const width = Math.min(containerWidth - margin.left - margin.right, 800);
    const height = Math.min(containerHeight - margin.top - margin.bottom, 400);

    // Select the SVG element and set its dimensions
    const svg = d3.select("#density-plot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Load and process the data
    Promise.all([
        d3.csv("data/GT_DataPD_MIT-CS1PD.csv"),
        d3.csv("data/GT_DataPD_MIT-CS2PD.csv")
    ]).then(([data1, data2]) => {
        const data = [...data1, ...data2]; // Merge the datasets

        // Convert typing speed to numbers and separate Parkinson's and non-Parkinson's groups
        const parkinsonsData = data
            .filter(d => d.gt === "True")
            .map(d => +d.typingSpeed)
            .filter(d => !isNaN(d));

        const nonParkinsonsData = data
            .filter(d => d.gt === "False")
            .map(d => +d.typingSpeed)
            .filter(d => !isNaN(d));

        // Kernel Density Estimation function
        function kernelDensityEstimator(kernel, X) {
            return function (V) {
                return X.map(function (x) {
                    return [x, d3.mean(V, function (v) { return kernel(x - v); })];
                });
            };
        }

        function epanechnikovKernel(bandwidth) {
            return function (u) {
                return Math.abs(u /= bandwidth) <= 1 ? 0.75 * (1 - u * u) / bandwidth : 0;
            };
        }

        // Calculate bandwidth (Silverman's rule of thumb)
        const parkBandwidth = 1.06 * d3.deviation(parkinsonsData) * Math.pow(parkinsonsData.length, -1 / 5);
        const nonParkBandwidth = 1.06 * d3.deviation(nonParkinsonsData) * Math.pow(nonParkinsonsData.length, -1 / 5);

        // Prepare X scale - Now fixed from 0 to 300
        const x = d3.scaleLinear()
            .domain([-10, 300])
            .range([0, width]);

        // Prepare Y scale
        const y = d3.scaleLinear()
            .range([height, 0]);

        // Create density estimators with more ticks for better CDF calculation
        const xTicks = x.ticks(300); // One tick per WPM for accurate CDF

        const parkDensity = kernelDensityEstimator(
            epanechnikovKernel(parkBandwidth),
            xTicks
        )(parkinsonsData);

        const nonParkDensity = kernelDensityEstimator(
            epanechnikovKernel(nonParkBandwidth),
            xTicks
        )(nonParkinsonsData);

        // Set Y domain based on max density
        y.domain([0, Math.max(
            d3.max(parkDensity, d => d[1]),
            d3.max(nonParkDensity, d => d[1])
        )]);

        // Create line generator
        const line = d3.line()
            .curve(d3.curveBasis)
            .x(d => x(d[0]))
            .y(d => y(d[1]));

        // Color scale function
        const colorScale = d => d.gt === "True" ? "#6c63ff" : "#ffb663";
        // Lighter color scale for shading
        const lighterColorScale = d => d.gt === "True" ? "#6c63ff55" : "#ffb66355";

        // Add Parkinson's density line
        svg.append("path")
            .datum(parkDensity)
            .attr("class", "density-line parkinson-line")
            .attr("fill", "none")
            .attr("stroke", data.find(d => d.gt === "True") ? colorScale(data.find(d => d.gt === "True")) : "#6c63ff")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Add non-Parkinson's density line
        svg.append("path")
            .datum(nonParkDensity)
            .attr("class", "density-line non-parkinson-line")
            .attr("fill", "none")
            .attr("stroke", data.find(d => d.gt === "False") ? colorScale(data.find(d => d.gt === "False")) : "#ffb663")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Add X axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add X axis label
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom * 0.7)
            .style("text-anchor", "middle")
            .text("Typing Speed (WPM)");

        // Add legend
        svg.append("circle")
            .attr("cx", width - 100)
            .attr("cy", 20)
            .attr("r", 6)
            .style("fill", data.find(d => d.gt === "True") ? colorScale(data.find(d => d.gt === "True")) : "#6c63ff");
        svg.append("text")
            .attr("x", width - 80)
            .attr("y", 20)
            .text("Parkinson's")
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");

        svg.append("circle")
            .attr("cx", width - 100)
            .attr("cy", 40)
            .attr("r", 6)
            .style("fill", data.find(d => d.gt === "False") ? colorScale(data.find(d => d.gt === "False")) : "#ffb663");
        svg.append("text")
            .attr("x", width - 80)
            .attr("y", 40)
            .text("Non-Parkinson's")
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");

        // Add a vertical line group that will show on hover
        const mouseG = svg.append("g")
            .attr("class", "mouse-over-effects")
            .style("opacity", 0);

        // Vertical line
        mouseG.append("line")
            .attr("class", "mouse-line")
            .attr("y1", 0)
            .attr("y2", height)
            .style("stroke", "#444")
            .style("stroke-width", "1px");

        // Add tooltip for showing values
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "rgba(255, 255, 255, 0.9)")
            .style("border", "1px solid #ddd")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("pointer-events", "none")
            .style("opacity", 0);

        // Add dots for intersection points
        const parkDot = mouseG.append("circle")
            .attr("class", "intersection-dot parkinson-dot")
            .attr("r", 5)
            .style("fill", data.find(d => d.gt === "True") ? colorScale(data.find(d => d.gt === "True")) : "#6c63ff")
            .style("stroke", "white")
            .style("stroke-width", "1.5px")
            .style("opacity", 0);

        const nonParkDot = mouseG.append("circle")
            .attr("class", "intersection-dot non-parkinson-dot")
            .attr("r", 5)
            .style("fill", data.find(d => d.gt === "False") ? colorScale(data.find(d => d.gt === "False")) : "#ffb663")
            .style("stroke", "white")
            .style("stroke-width", "1.5px")
            .style("opacity", 0);

        // CDF SHADING ELEMENTS
        const cdfGroup = svg.append("g")
            .attr("class", "cdf-group")
            .style("opacity", 0); 

        const parkShade = cdfGroup.append("path")
            .attr("class", "cdf-shade parkinson-shade")
            .style("fill", data.find(d => d.gt === "True") ? lighterColorScale(data.find(d => d.gt === "True")) : "#6c63ff55") // Lighter shade
            .style("stroke", "none");

        const nonParkShade = cdfGroup.append("path")
            .attr("class", "cdf-shade non-parkinson-shade")
            .style("fill", data.find(d => d.gt === "False") ? lighterColorScale(data.find(d => d.gt === "False")) : "#ffb66355") // Lighter shade
            .style("stroke", "none");


        // Vertical lines for CDF bounds (keep these, but they are now less visually prominent)
        const startLine = cdfGroup.append("line")
            .attr("class", "cdf-start-line")
            .attr("y1", 0)
            .attr("y2", height)
            .style("stroke", "#666")
            .style("stroke-width", "1px")
            .style("opacity", 0); // Initially hidden

        const endLine = cdfGroup.append("line")
            .attr("class", "cdf-end-line")
            .attr("y1", 0)
            .attr("y2", height)
            .style("stroke", "#666")
            .style("stroke-width", "1px")
            .style("opacity", 0); // Initially hidden


        // CDF result tooltip
        const cdfTooltip = d3.select("body").append("div")
            .attr("class", "cdf-tooltip")
            .style("position", "absolute")
            .style("background-color", "rgba(255, 255, 255, 0.9)")
            .style("border", "2px solid #333")
            .style("border-radius", "5px")
            .style("padding", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("font-weight", "bold")
            .style("box-shadow", "0 4px 8px rgba(0,0,0,0.2)");

        // Function to calculate CDF between two x-values
        function calculateCDF(densityData, startX, endX) {
            // Find indices in density data
            const bisect = d3.bisector(d => d[0]).left;
            let startIdx = bisect(densityData, startX);
            let endIdx = bisect(densityData, endX);

            // Ensure valid indices
            startIdx = Math.max(0, startIdx - 1);
            endIdx = Math.min(densityData.length - 1, endIdx);

            if (startIdx >= endIdx) return 0;

            // Calculate the CDF using trapezoidal rule for numerical integration
            let sum = 0;
            for (let i = startIdx; i < endIdx; i++) {
                // Width × average height
                const width = densityData[i + 1][0] - densityData[i][0];
                const avgHeight = (densityData[i][1] + densityData[i + 1][1]) / 2;
                sum += width * avgHeight;
            }

            // Return the approximate probability 
            return sum;
        }

        // SHADE UPDATE FUNCTION 
        function updateCDFArea(startX, endX) {
            const cdfStartX = Math.min(startX, endX);
            const cdfEndX = Math.max(startX, endX);

            // Create area generator for shading
            const areaGenerator = d3.area()
                .curve(d3.curveBasis)
                .x(d => x(d[0]))
                .y0(height)  // Bottom of the area
                .y1(d => y(d[1]));

            // Update Parkinson's shading
            const parkShadedData = parkDensity.filter(d => d[0] >= cdfStartX && d[0] <= cdfEndX);
            parkShade.datum(parkShadedData)
                .attr("d", areaGenerator);

            // Update Non-Parkinson's shading
            const nonParkShadedData = nonParkDensity.filter(d => d[0] >= cdfStartX && d[0] <= cdfEndX);
            nonParkShade.datum(nonParkShadedData)
                .attr("d", areaGenerator);

            //Show vertical lines
            startLine.attr("transform", `translate(${x(cdfStartX)}, 0)`);
            endLine.attr("transform", `translate(${x(cdfEndX)}, 0)`);
        }

        // Variables to track drag state
        let isDragging = false;
        let dragStartX = 0;
        let dragEndX = 0;

        // Create a rect to capture mouse movements
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("mouseover", () => {
                mouseG.style("opacity", 1);
                tooltip.style("opacity", 1);
            })
            .on("mouseout", () => {
                if (!isDragging) {
                    mouseG.style("opacity", 0);
                    tooltip.style("opacity", 0);
                }
            })
            .on("mousemove", function (event) {
                // Throttle/smooth the movement
                if (this._lastUpdate && Date.now() - this._lastUpdate < 10) {
                    return; // Limit updates
                }
                this._lastUpdate = Date.now();

                // Get mouse position
                const mouse = d3.pointer(event);

                // Convert x position to domain value
                const xValue = x.invert(mouse[0]);

                // If dragging, update end position and CDF display
                if (isDragging) {
                    dragEndX = xValue;

                    // Ensure start < end
                    const cdfStartX = Math.min(dragStartX, dragEndX);
                    const cdfEndX = Math.max(dragStartX, dragEndX);

                    updateCDFArea(cdfStartX, cdfEndX);


                    // Calculate CDF values
                    const parkCDF = calculateCDF(parkDensity, cdfStartX, cdfEndX);
                    const nonParkCDF = calculateCDF(nonParkDensity, cdfStartX, cdfEndX);

                    // Show CDF tooltip with results
                    cdfTooltip.html(`
                        <div style="text-align: center; margin-bottom: 8px;">CDF from ${cdfStartX.toFixed(1)} to ${cdfEndX.toFixed(1)} WPM</div>
                        <div style="color: #6c63ff; margin: 5px 0;">Parkinson's: ${(parkCDF * 100).toFixed(1)}%</div>
                        <div style="color: #ffb663; margin: 5px 0;">Non-Parkinson's: ${(nonParkCDF * 100).toFixed(1)}%</div>
                    `)
                        .style("left", (event.pageX + 20) + "px")
                        .style("top", (event.pageY - 40) + "px")
                        .style("opacity", 1);

                    // Show the CDF group
                    cdfGroup.style("opacity", 1);
                    startLine.style("opacity", 1); //show start line
                    endLine.style("opacity", 1); //show end line

                    return;
                }

                // If not dragging, show standard hover effects
                mouseG.select(".mouse-line")
                    .transition()
                    .duration(50)
                    .ease(d3.easeLinear)
                    .attr("transform", `translate(${mouse[0]}, 0)`);

                // Find closest points in density data
                const bisect = d3.bisector(d => d[0]).left;
                const parkIndex = bisect(parkDensity, xValue);
                const nonParkIndex = bisect(nonParkDensity, xValue);

                // Get y values if available
                let parkValue = "N/A";
                let nonParkValue = "N/A";
                let parkYPos = 0;
                let nonParkYPos = 0;

                if (parkIndex > 0 && parkIndex < parkDensity.length) {
                    const parkDensityValue = parkDensity[parkIndex][1];
                    parkValue = parkDensityValue.toFixed(3);
                    parkYPos = y(parkDensityValue);

                    // Update Parkinson's dot position
                    parkDot.style("opacity", 1)
                        .transition()
                        .duration(50)
                        .ease(d3.easeLinear)
                        .attr("cx", mouse[0])
                        .attr("cy", parkYPos);
                } else {
                    parkDot.style("opacity", 0);
                }

                if (nonParkIndex > 0 && nonParkIndex < nonParkDensity.length) {
                    const nonParkDensityValue = nonParkDensity[nonParkIndex][1];
                    nonParkValue = nonParkDensityValue.toFixed(3);
                    nonParkYPos = y(nonParkDensityValue);

                    // Update non-Parkinson's dot position
                    nonParkDot.style("opacity", 1)
                        .transition()
                        .duration(50)
                        .ease(d3.easeLinear)
                        .attr("cx", mouse[0])
                        .attr("cy", nonParkYPos);
                } else {
                    nonParkDot.style("opacity", 0);
                }

                // Update tooltip
                tooltip.html(`
                    <div style="font-weight: bold">Typing Speed: ${xValue.toFixed(1)} WPM</div>
                    <div style="color: #6c63ff">Parkinson's Density: ${parkValue}</div>
                    <div style="color: #ffb663">Non-Parkinson's Density: ${nonParkValue}</div>
                    <div style="font-style: italic; margin-top: 5px;">Click and drag to calculate CDF</div>
                `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 30) + "px");
            })
            .on("mousedown", function (event) {
                // Start dragging
                isDragging = true;

                // Hide normal tooltip
                tooltip.style("opacity", 0);

                // Record start position
                const mouse = d3.pointer(event);
                dragStartX = x.invert(mouse[0]);
                dragEndX = dragStartX;

                updateCDFArea(dragStartX, dragEndX);

                // Show CDF elements
                cdfGroup.style("opacity", 1);
                startLine.style("opacity", 1); //show start line
                endLine.style("opacity", 1); //show end line

                // Prevent default behavior
                event.preventDefault();
            })
            .on("mouseup", function () {
                // HIDE CDF ON MOUSE UP 
                if (isDragging) {
                    isDragging = false;
                    cdfGroup.style("opacity", 0);  // Hide shading
                    cdfTooltip.style("opacity", 0); // Hide tooltip
                    startLine.style("opacity", 0); //hide start line
                    endLine.style("opacity", 0); //hide end line
                }

                // Show normal hover elements
                mouseG.style("opacity", 1);
            })
            .on("mouseleave", function () {
                if (!isDragging) {
                    mouseG.style("opacity", 0);
                    tooltip.style("opacity", 0);
                }
            });

        // Handle mouseup outside the plot (also hide CDF)
        d3.select(window).on("mouseup", function () {
            if (isDragging) {
                isDragging = false;
                cdfGroup.style("opacity", 0);
                cdfTooltip.style("opacity", 0);
                startLine.style("opacity", 0); //hide start line
                endLine.style("opacity", 0); //hide end line
            }
        });
    }).catch(error => {
        console.error("Error loading the data:", error);
    });
});