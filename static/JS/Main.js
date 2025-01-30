let menuEntrySwitch = (from, to) => {
    from.style.transitionDuration = "0.3s"
    from.style.opacity = "0"
    from.style.scale = "0.7"
    from.style.filter = "blur(10px)"

    to.style.opacity = "0"
    to.style.scale = "0.7"
    from.style.filter = "blur(10px)"
    setTimeout(() => {
        from.style.display = "none"
        to.style.display = "flex"
        bobatron.scanner()
    }, 310)
    setTimeout(() => {
        to.style.transitionDuration = "0.3s"
        to.style.opacity = "1"
        to.style.scale = "1"
        from.style.filter = "blur(0px)"
        bobatron.scanner()
    }, 315)
}

let getRandomColor = () => {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

const getData = async (url = '') => {
    const response = await fetch(url, {
        method: 'GET',
    });
    return response.json();
}

class MyLovelyDiagrams {
    location = "loading";
    currentChart = null;

    screens = {
        loading: document.getElementById("loading"),
        menuRequestDataset: document.getElementById("menuRequestDataset"),
        menuRequestMetrics: document.getElementById("menuRequestMetrics"),
        chartBuilder: document.getElementById("chartBuilder"),
        metricsBuilder: document.getElementById("metricsBuilder")
    }

    constructor(location) {
        if (location !== this.location) {
            this.locationSwitch(location)
        }

        this.menuRequestDataset()
        this.menuRequestMetrics()

        document.getElementById("getChartBtn").onclick = () => {
            this.locationSwitch("menuRequestDataset")
            this.menuRequestDataset()
        }
        document.getElementById("getMetricsBtn").onclick = () => {
            this.locationSwitch("menuRequestMetrics")
            this.menuRequestMetrics()
        }
    }

    locationSwitch(to) {
        menuEntrySwitch(this.screens[this.location], this.screens[to])
        this.location = to
    }

    chartBuilder(data, fields) {
        const ctx = document.getElementById('graph').getContext('2d');

        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }

        this.currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                datasets: []
            },
            options: {
                responsive: true,
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }
            }
        });

        let datasets = [];
        for (let i of fields) {
            let formattedData = data.map(item => ({
                x: String(item.timestamp),
                y: item[i]
            }));

            datasets.push({
                label: i,
                data: formattedData,
                borderColor: "#000000",
                backgroundColor: `${getRandomColor()}9A`,
                fill: true
            });
        }

        this.currentChart.data.datasets = datasets;
        this.currentChart.update();
    }

    metricsBuilder(data, field) {
        document.getElementById("metricsField").innerHTML = `
            <h3>${field}</h3>
            <br>
            <p>avg: ${data.avg}</p>
            <br>
            <p>max: ${data.max}</p>
            <br>
            <p>min: ${data.min}</p>
            <br>
            <p>stdDev: ${data.stdDev}</p>
        `
    }

    menuRequestDataset() {
        const addFieldButton = document.getElementById("addField"),
            fieldsWrapper = document.getElementById("fieldsWrapper"),
            collectionInput = document.getElementById("collectionName"),
            fields = document.getElementsByClassName("fields"),
            dateMin = document.getElementById("dateMin"),
            dateMax = document.getElementById("dateMax"),
            findDataBtn = document.getElementById("findData");

        addFieldButton.onclick = () => {
            let field = document.createElement("div")
            field.classList.add("horizontal-container", "flex-aligncenter");
            field.style.gap = "10px"
            field.innerHTML = `
                <p style="width: 45px;">field${document.getElementsByClassName("fields").length + 1}</p>
                <input type="text" class="bobatron fields" style="width: 100%" Bt-CM="0.5" placeholder="field" required>
            `
            fieldsWrapper.appendChild(field)
            bobatron.scanner()
        }

        findDataBtn.onclick = async () => {
            let isValid = true;
            let errorMessage = "";

            if (!collectionInput.value.trim()) {
                isValid = false;
                errorMessage += "- Collection name is required.\n";
            }

            let queryFields = []
            for (let i of fields) {
                if (i.value) {
                    queryFields.push(i.value)
                }
            }

            if (dateMin.value && dateMax.value) {
                if (new Date(dateMin.value) > new Date(dateMax.value)) {
                    isValid = false;
                    errorMessage += "- 'From' date cannot be later than 'To' date.\n";
                }
            }

            if (!isValid) {
                alert(errorMessage);
            } else {
                let query = `${window.location.href}api/${collectionInput.value.trim()}/measurements?fields=${queryFields}&start_date=${dateMin.value}&end_date=${dateMax.value}`
                this.locationSwitch("chartBuilder")
                let data = await getData(query)
                this.chartBuilder(data, queryFields)
            }
        }
    }

    menuRequestMetrics() {
        const collectionInput = document.getElementById("collectionName2"),
            reqField = document.getElementById("reqField"),
            getMetricsBtn = document.getElementById("getMetricsBtn2");

        getMetricsBtn.onclick = async () => {
            let isValid = true;
            let errorMessage = "";

            if (!collectionInput.value.trim()) {
                isValid = false;
                errorMessage += "- Collection name is required.\n";
            }

            if (!reqField.value.trim()) {
                isValid = false;
                errorMessage += "- Field name is required.\n";
            }

            if (!isValid) {
                alert(errorMessage);
            } else {
                let query = `${window.location.href}api/${collectionInput.value.trim()}/measurements/metrics?field=${reqField.value}`
                this.locationSwitch("metricsBuilder")
                let data = await getData(query)
                this.metricsBuilder(data, reqField.value)
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    bobatron.scanner()

    let app = new MyLovelyDiagrams("menuRequestDataset");
})
window.addEventListener("resize", () => {
    bobatron.scanner()
})