(() => {
  const data = [
    { type: 'Walking', speed: 3.1, range: 30 },
    { type: 'Boosted Mini S Board', speed: 18, range: 7 },
    { type: 'Evolve Bamboo GTR 2in1', speed: 24, range: 31 },
    { type: 'OneWheel XR', speed: 19, range: 18 },
    { type: 'MotoTec Skateboard', speed: 22, range: 10 },
    { type: 'Segway Ninebot S', speed: 10, range: 13 },
    { type: 'Segway Ninebot S-PLUS', speed: 12, range: 22 },
    { type: 'Razor Scooter', speed: 18, range: 15 },
    { type: 'GeoBlade 500', speed: 15, range: 8 },
    { type: 'Hovertrax Hoverboard', speed: 9, range: 6 },
  ].map((d, i) => ({ ...d, color: d3.schemeCategory10[i] }));

  const buttons = {};
  const vehicleButtons = document.querySelector('#vehicle-buttons');
  data.forEach(d => {
    const child = document.createElement('div');
    child.className = "vehicle-button";
    child.onclick = () => setState({ type: d.type });

    const head = document.createElement('h6');
    head.innerHTML = `<span class="dot" style="background-color: ${d.color}"></span> ${d.type}`;
    head.style = 'font-size: 14px'
    child.appendChild(head)

    const distanceBox = document.createElement('div');
    distanceBox.className = "d-flex justify-content-between";
    const distanceText = document.createElement('span');
    distanceText.innerText = 'Distance:';
    distanceBox.appendChild(distanceText);
    distanceBox.appendChild(document.createElement('span'));
    child.appendChild(distanceBox);

    const timeBox = document.createElement('div');
    timeBox.className = "d-flex justify-content-between";
    const timeText = document.createElement('span');
    timeText.innerText = 'Time:';
    timeBox.appendChild(timeText);
    timeBox.appendChild(document.createElement('span'));
    child.appendChild(timeBox);

    vehicleButtons.appendChild(child);
    buttons[d.type] = child;
  })


  const distanceSlider = document.querySelector('#distance-slider');
  distanceSlider.addEventListener('input', event => {
    const distance = event.target.value;
    setState({ distance })
  });

  const timeToggle = document.querySelector('#time-radio');
  const distanceToggle = document.querySelector('#distance-radio');
  timeToggle.onchange = () => setState({ conversion: !timeToggle.checked });
  distanceToggle.onchange = () => setState({ conversion: !timeToggle.cheked });

  const vlSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 350,
    height: 200,
    encoding: {
      x: { field: 'time', type: 'quantitative', title: 'Time (Minutes)' },
      y: { field: 'distance', type: 'quantitative', title: 'Distance (Miles)' },
      detail: { field: 'type', type: 'nominal' },
      color: {
        field: 'color', legend: null, scale: {
          domain: d3.schemeCategory10.concat(['#000000']),
          range: d3.schemeCategory10.concat(['#000000']),
        }
      },
      opacity: { field: 'valid', legend: null },
    },
    layer: [
      {
        mark: 'circle',
        data: { name: 'points' }
      },
      {
        mark: 'line',
        data: { name: 'lines' }
      },
    ]
  };

  const view = new vega.View(vega.parse(vegaLite.compile(vlSpec).spec), {
    renderer: 'svg',
    container: '#view',
    hover: true
  });
  view.width(document.getElementsByTagName('body')[0].offsetWidth - 100).height(200).runAsync();

  window.addEventListener('resize', () => {
    const body = document.getElementsByTagName('body')[0];
    const width = body.offsetWidth;

    if (width < 1200) {
      view.width(width - 100).height(200).runAsync();
    } else {
      view.width(width - 750).height(600).runAsync();
    }
  }, true)

  const state = {
    type: null,
    distance: null,
    conversion: null,
  };

  function setState({ type, distance, conversion }) {
    state.type = type ?? state.type;
    state.distance = parseFloat(distance ?? state.distance);
    state.conversion = !!(conversion ?? state.conversion);

    const currentVehicle = data.find(d => d.type === state.type);
    if (!currentVehicle) {
      alert(state.type, 'not found');
    }
    distanceSlider.setAttribute('max', currentVehicle.range);
    if (currentVehicle.range < state.distance) {
      state.distance = parseFloat(currentVehicle.range);
    }

    document.querySelector('#time-display').innerText = `${format2(60 * state.distance / currentVehicle.speed)} Minutes`
    document.querySelector('#distance-display').innerText = `${format2(state.distance)} Miles`

    data.forEach(d => {
      const button = buttons[d.type];
      const distanceBox = button.children[1].children[1];
      const timeBox = button.children[2].children[1];

      distanceBox.innerText = `${format2(getDistance(state, currentVehicle, d))} Miles`;
      timeBox.innerText = `${format2(getTime(state, currentVehicle, d))} Minutes`;

      if (isValid(state, currentVehicle, d)) {
        removeClass(button, 'vehicle-button-inactive')
      } else {
        addClass(button, 'vehicle-button-inactive')
      }

      if (state.conversion) {
        removeClass(timeBox, 'not-interesting-value')
        addClass(distanceBox, 'not-interesting-value')
      } else {
        addClass(timeBox, 'not-interesting-value')
        removeClass(distanceBox, 'not-interesting-value')
      }

      if (state.type === d.type) {
        addClass(button, 'vehicle-button-pressed')
      } else {
        removeClass(button, 'vehicle-button-pressed')
      }
    })

    const distanceDisplay = document.querySelector('#distance-display');
    const timeDisplay = document.querySelector('#time-display');
    if (state.conversion) {
      addClass(timeDisplay, 'not-interesting-value');
      removeClass(distanceDisplay, 'not-interesting-value');
    } else {
      removeClass(timeDisplay, 'not-interesting-value');
      addClass(distanceDisplay, 'not-interesting-value');
    }

    const changeSetPoints = vega
      .changeset()
      .insert(data.map(d => ({
        ...d,
        time: getTime(state, currentVehicle, d),
        distance: getDistance(state, currentVehicle, d),
        valid: isValid(state, currentVehicle, d) ? 1 : 0.001,
        color: d.type === currentVehicle.type ? '#000000' : d.color,
      })))
      .remove(() => true);
    const changeSetLines = vega
      .changeset()
      .insert([
        ...data.map(d => ({
          ...d,
          time: 0,
          distance: 0,
          valid: isValid(state, currentVehicle, d) ? 1 : 0.001,
          color: d.type === currentVehicle.type ? '#000000' : d.color,
        })),
        ...data.map(d => ({
          ...d,
          time: 60 * d.range / d.speed,
          distance: d.range,
          valid: isValid(state, currentVehicle, d) ? 1 : 0.001,
          color: d.type === currentVehicle.type ? '#000000' : d.color,
        }))
      ])
      .remove(() => true);

    view
      .change('points', changeSetPoints)
      .change('lines', changeSetLines)
      .run();
  }

  setState({
    type: data[0].type,
    distance: distanceSlider.value,
    conversion: !timeToggle.checked
  });
})()