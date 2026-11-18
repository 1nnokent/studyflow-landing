import { useState, type ChangeEvent } from 'react';
import { selectSubjects, selectTasks, useAppDispatch, useAppSelector } from '../app/store';
import { replaceWorkspace, errorMessage } from '../state/actions';
import { notify } from '../state/uiSlice';
import { emptyWorkspace, parseWorkspace } from '../domain/workspace';
import { demoWorkspace } from '../data/demo';
import type { Workspace } from '../domain/types';
import { Button, ConfirmDialog, PageHeader } from '../components/ui';
import { Icon } from '../components/Icon';

interface Replacement {
  title: string;
  description: string;
  confirmLabel: string;
  document: Workspace;
}
export function AboutPage() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(selectTasks);
  const subjects = useAppSelector(selectSubjects);
  const mode = useAppSelector((state) => state.tasks.mode);
  const busy = useAppSelector((state) => state.tasks.replacing);
  const [replacement, setReplacement] = useState<Replacement | null>(null);
  const [error, setError] = useState('');
  const [importError, setImportError] = useState('');
  function exportData() {
    const document: Workspace = {
      schemaVersion: 1,
      mode,
      updatedAt: new Date().toISOString(),
      tasks,
      subjects,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' }),
    );
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `studyflow-${new Date().toISOString().slice(0, 10)}.json`;
    window.document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    dispatch(notify('Резервная копия подготовлена'));
  }
  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setImportError('');
    setError('');
    try {
      if (file.size > 2 * 1024 * 1024)
        throw new Error('Файл слишком большой. Выберите резервную копию размером до 2 МБ.');
      const document = parseWorkspace(await file.text());
      setReplacement({
        title: 'Восстановить план из файла?',
        description: `В копии ${document.subjects.length} предметов и ${document.tasks.length} задач. Текущий план будет заменён.`,
        confirmLabel: 'Восстановить план',
        document,
      });
    } catch (cause) {
      setImportError(errorMessage(cause));
    }
  }
  async function replace() {
    if (!replacement) return;
    try {
      await dispatch(replaceWorkspace(replacement.document)).unwrap();
      setReplacement(null);
      dispatch(notify('План обновлён'));
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Твой ритм. Твой план."
        title="О StudyFlow"
        description="Место для учебных задач, которые приходят из разных источников."
      />
      <section className="about-intro panel">
        <span className="about-symbol">
          <Icon name="spark" />
        </span>
        <div>
          <h2>Учёба, в которой всё по местам.</h2>
          <p>
            Собирай задания из университета, курсов и личных проектов. Указывай сроки, выбирай
            приоритеты и отмечай выполненное. На обзоре всегда видно, что требует внимания и сколько
            уже сделано.
          </p>
          <div className="about-chips">
            <span>Предметы и задачи</span>
            <span>Личный прогресс</span>
            <span>Твои приоритеты</span>
          </div>
        </div>
      </section>
      <section className="data-section" id="data" aria-labelledby="data-heading">
        <div className="section-title">
          <div>
            <p className="eyebrow">Только на этом устройстве</p>
            <h2 id="data-heading">Твои данные</h2>
          </div>
          <Icon name="shield" />
        </div>
        <p className="data-explanation">
          План хранится в этом браузере. На другом устройстве он автоматически не появится. Перед
          очисткой браузера сохрани резервную копию, чтобы не потерять задания.
        </p>
        <div className="data-actions-grid">
          <article className="panel data-card">
            <Icon name="download" />
            <h3>Сохранить копию</h3>
            <p>Скачай план в JSON-файле и сохрани его в надёжном месте.</p>
            <Button variant="secondary" onClick={exportData}>
              Скачать копию
            </Button>
          </article>
          <article className="panel data-card">
            <Icon name="upload" />
            <h3>Восстановить план</h3>
            <p>Выбери файл, который ранее сохранил из StudyFlow.</p>
            <label className={`button button-secondary file-button ${busy ? 'disabled' : ''}`}>
              Выбрать файл
              <input
                type="file"
                accept=".json,application/json"
                aria-label="Импортировать резервную копию"
                disabled={busy}
                onChange={(event) => {
                  void importData(event);
                }}
              />
            </label>
          </article>
        </div>
        {importError && (
          <p role="alert" className="error-message">
            {importError}
          </p>
        )}
        <div className="panel reset-data">
          <div>
            <h3>{mode === 'demo' ? 'Готов начать свой план?' : 'Начать заново'}</h3>
            <p>Очисти примеры или текущие задания и заполни пространство своими предметами.</p>
          </div>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setError('');
              setReplacement({
                title: 'Начать с чистого плана?',
                description:
                  'Все задачи и предметы в этом браузере будут удалены. Сначала скачай копию, если хочешь сохранить текущие данные.',
                confirmLabel: 'Очистить план',
                document: emptyWorkspace(),
              });
            }}
          >
            Начать с чистого плана
          </Button>
        </div>
        <button
          className="text-button restore-demo"
          type="button"
          disabled={busy}
          onClick={() => {
            setError('');
            setReplacement({
              title: 'Загрузить пример плана?',
              description:
                'Текущие данные будут заменены примером учебной недели. Сохрани резервную копию, если задания ещё пригодятся.',
              confirmLabel: 'Загрузить пример',
              document: demoWorkspace(),
            });
          }}
        >
          <Icon name="back" />
          Вернуть пример учебной недели
        </button>
      </section>
      <section className="about-version">
        <span>StudyFlow 0.3</span>
        <p>Frontend MVP. React, TypeScript, Redux Toolkit и React Router.</p>
        <a href="https://github.com/1nnokent/studyflow-landing" target="_blank" rel="noreferrer">
          Исходный код
          <Icon name="external" />
        </a>
      </section>
      {replacement && (
        <ConfirmDialog
          title={replacement.title}
          description={replacement.description}
          confirmLabel={replacement.confirmLabel}
          onConfirm={() => {
            void replace();
          }}
          onClose={() => setReplacement(null)}
          busy={busy}
          error={error}
        />
      )}
    </>
  );
}
