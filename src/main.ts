const daysOfWeek: string[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
type TemperatureData = { day: string; temperature: number };
let savedData: TemperatureData[] = [];

const colorTemperatureCells = (): void => {
  const cells = document.querySelectorAll<HTMLTableCellElement>('#adat-tablazat td:nth-child(2)');

  cells.forEach(cell => {
    const temperature = Number(cell.textContent);
    cell.style.backgroundColor = '';

    if (Number.isFinite(temperature)) {
      if (temperature < 10) {
        cell.style.backgroundColor = 'blue';
      } else if (temperature >= 30) {
        cell.style.backgroundColor = '#E97451';
      }
    }
  });
};

const getWeatherData = async (): Promise<void> => {
  try {
    const response = await fetch('https://petrik-idojaras-default-rtdb.europe-west1.firebasedatabase.app/.json');
    if (!response.ok) throw new Error(`HTTP hiba: ${response.status}`);

    const data = await response.json() as Record<string, unknown>;
    const tbody = document.querySelector<HTMLTableSectionElement>('#adat-tablazat tbody');
    if (!tbody) return;

    tbody.replaceChildren();
    const adatok = Array.isArray(data)
      ? data
      : daysOfWeek.map(day => ({ day, temperature: data[day] }))
          .filter(adat => adat.temperature !== undefined && adat.temperature !== null);

    savedData = adatok.map((adat, index): TemperatureData => {
      const value = typeof adat === 'object' && adat !== null
        ? adat as { day?: string; temperature?: number }
        : { temperature: adat as number };
      return {
        day: value.day ?? daysOfWeek[index] ?? '',
        temperature: Number(value.temperature)
      };
    }).filter(adat => Number.isFinite(adat.temperature));

    savedData.forEach(adat => {
      const row = document.createElement('tr');
      const dayCell = document.createElement('td');
      const temperatureCell = document.createElement('td');

      dayCell.textContent = adat.day;
      temperatureCell.textContent = String(adat.temperature);
      row.append(dayCell, temperatureCell);
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Hiba az időjárási adatok betöltésekor:', error);
  }

  colorTemperatureCells();
};

const createTemperatureForm = (): void => {
  const table = document.querySelector<HTMLTableElement>('#adat-tablazat');
  if (!table || document.querySelector('#homerseklet-urlap')) return;

  const form = document.createElement('form');
  form.id = 'homerseklet-urlap';

  const temperatureInput = document.createElement('input');
  temperatureInput.type = 'number';
  temperatureInput.step = '0.1';
  temperatureInput.required = true;
  temperatureInput.placeholder = 'Hőmérséklet (°C)';
  temperatureInput.setAttribute('aria-label', 'Hőmérséklet');

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Hozzáadás';

  form.append(temperatureInput, submitButton);
  table.before(form);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const temperature = Number(temperatureInput.value);
    if (!Number.isFinite(temperature)) return;

    const dayIndex = (new Date().getDay() + 6) % 7;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const row = document.createElement('tr');
    const dayCell = document.createElement('td');
    const temperatureCell = document.createElement('td');
    dayCell.textContent = daysOfWeek[dayIndex];
    temperatureCell.textContent = String(temperature);
    savedData.push({ day: daysOfWeek[dayIndex], temperature });
    row.append(dayCell, temperatureCell);
    tbody.appendChild(row);
    colorTemperatureCells();
    form.reset();
  });

  const exportButton = document.createElement('button');
  exportButton.type = 'button';
  exportButton.textContent = 'Export';
  const exportField = document.createElement('textarea');
  exportField.rows = 10;
  exportField.readOnly = true;
  exportField.setAttribute('aria-label', 'Exportált adatok');
  table.after(exportButton, exportField);
  exportButton.addEventListener('click', () => {
    exportField.value = JSON.stringify(savedData, null, 2);
  });
};

getWeatherData();
createTemperatureForm();

