'use strict';

// Данные примера хранятся в памяти и сбрасываются при обновлении страницы.
document.documentElement.classList.add('js');

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menuToggle.hidden = false;

function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
  navigation.classList.remove('is-open');
}

menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  navigation.classList.toggle('is-open', open);
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuToggle.focus();
  }
});

const mobileViewport = window.matchMedia('(max-width: 760px)');
mobileViewport.addEventListener('change', closeMenu);

const demo = document.querySelector('#demo');
const taskRows = [...document.querySelectorAll('.demo-task')];
const subjectFilters = [...document.querySelectorAll('.subject-filter')];
const subjectSelect = document.querySelector('#demo-subject');
const periodButtons = [...document.querySelectorAll('[data-period]')];
const announcement = document.querySelector('#demo-announcement');
const listTitle = document.querySelector('#demo-list-title');
const emptyMessage = document.querySelector('.demo-empty');
const overviewButton = document.querySelector('[data-overview]');
const allTasksButton = document.querySelector('[data-all-tasks]');
const initialTaskDates = new Map(taskRows.map((row) => [row.dataset.task, row.querySelector('.task-date').textContent]));
let selectedPeriod = 'week';
let selectedSubject = null;
let highlightTimeout;

function updateProgress() {
  const doneCount = taskRows.filter((row) => row.querySelector('input').checked).length;
  const percent = Math.round((doneCount / taskRows.length) * 100);
  document.querySelector('#completed-count').replaceChildren(
    document.createTextNode(`${doneCount} `),
    Object.assign(document.createElement('span'), { textContent: `из ${taskRows.length}` }),
  );
  document.querySelector('#progress-label').textContent = `${percent}%`;
  const progress = document.querySelector('#demo-progress');
  progress.value = doneCount;
  progress.textContent = `${percent}%`;
  taskRows.forEach((row) => {
    const done = row.querySelector('input').checked;
    row.classList.toggle('is-done', done);
    row.querySelector('.task-date').textContent = done ? 'Готово' : initialTaskDates.get(row.dataset.task);
  });
  return doneCount;
}

function filterTasks() {
  let visibleCount = 0;
  taskRows.forEach((row) => {
    const matchesSubject = !selectedSubject || row.dataset.subject === selectedSubject;
    const matchesPeriod = selectedPeriod === 'week' || row.dataset.day === 'today';
    row.hidden = !(matchesSubject && matchesPeriod);
    if (!row.hidden) visibleCount++;
  });
  subjectFilters.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.subject === selectedSubject)));
  subjectSelect.value = selectedSubject || '';
  periodButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.period === selectedPeriod)));
  const selectedButton = subjectFilters.find((button) => button.dataset.subject === selectedSubject);
  listTitle.textContent = selectedButton ? selectedButton.textContent.trim() : 'Твой план';
  emptyMessage.hidden = visibleCount !== 0;
  document.querySelector('.demo-tasks').hidden = visibleCount === 0;
  overviewButton.classList.toggle('active', !selectedSubject && selectedPeriod === 'week');
  allTasksButton.classList.remove('active');
  announcement.textContent = `Показано задач: ${visibleCount}. ${selectedButton ? selectedButton.textContent.trim() : 'Все предметы'}. ${selectedPeriod === 'today' ? 'Сегодня' : 'На неделе'}.`;
}

subjectFilters.forEach((button) => button.addEventListener('click', () => {
  selectedSubject = selectedSubject === button.dataset.subject ? null : button.dataset.subject;
  filterTasks();
}));

subjectSelect.addEventListener('change', () => {
  selectedSubject = subjectSelect.value || null;
  filterTasks();
});

periodButtons.forEach((button) => button.addEventListener('click', () => {
  selectedPeriod = button.dataset.period;
  filterTasks();
}));

function showAllTasks() {
  selectedSubject = null;
  selectedPeriod = 'week';
  filterTasks();
}
overviewButton.addEventListener('click', showAllTasks);
allTasksButton.addEventListener('click', showAllTasks);

taskRows.forEach((row) => row.querySelector('input').addEventListener('change', () => {
  const doneCount = updateProgress();
  announcement.textContent = `Выполнено ${doneCount} из ${taskRows.length} задач.`;
}));

document.querySelector('[data-reset]').addEventListener('click', () => {
  taskRows.forEach((row) => { row.querySelector('input').checked = row.dataset.task === 'article'; });
  showAllTasks();
  updateProgress();
  announcement.textContent = 'Демонстрационный план сброшен. Выполнена одна из четырёх задач.';
});

document.querySelectorAll('a[href="#demo"]').forEach((link) => link.addEventListener('click', () => {
  showAllTasks();
  demo.focus({ preventScroll: true });
  demo.classList.remove('demo-highlight');
  window.requestAnimationFrame(() => demo.classList.add('demo-highlight'));
  window.clearTimeout(highlightTimeout);
  highlightTimeout = window.setTimeout(() => demo.classList.remove('demo-highlight'), 1400);
}));

updateProgress();
