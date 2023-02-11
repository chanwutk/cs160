function format2(num) {
  return (Math.round(num * 100) / 100).toFixed(2);
}

function removeClass(elm, className) {
  elm.className = elm.className.split(' ').filter(d => d !== className).join(' ');
}

function addClass(elm, className) {
  removeClass(elm, className);
  elm.className += ' ' + className;
}

function getTime(state, currentVehicle, d) {
  return 60 * (state.conversion
    ? Math.min(state.distance, d.range) / d.speed
    : Math.min(state.distance / currentVehicle.speed, d.range / d.speed))
}

function getDistance(state, currentVehicle, d) {
  return state.conversion
    ? Math.min(state.distance, d.range)
    : Math.min(d.speed * state.distance / currentVehicle.speed, d.range);
}

function getPercentProgress(state, d, data) {
  return state.conversion
    ? Math.min((state.distance / d.speed), d.timeLimit) / Math.max(...data.map(d => d.timeLimit))
    : Math.min(state.time * d.speed, d.range) / Math.max(...data.map(d => d.range));
}

function isValid(state, currentVehicle, d) {
  return state.conversion
    ? (state.distance <= d.range)
    : (state.distance / currentVehicle.speed <= d.range / d.speed);
}
