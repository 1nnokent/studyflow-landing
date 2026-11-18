import { useState } from 'react';
import { Link } from 'react-router-dom';
import { selectSubjects, selectTasks, useAppDispatch, useAppSelector } from '../app/store';
import { deleteSubject, errorMessage } from '../state/actions';
import { notify } from '../state/uiSlice';
import { getProgress, taskCount } from '../domain/tasks';
import type { Subject } from '../domain/types';
import { Button, ConfirmDialog, EmptyState, PageHeader, Progress } from '../components/ui';
import { SubjectDialog } from '../components/SubjectDialog';
import { Icon } from '../components/Icon';

export function SubjectsPage() {
  const subjects = useAppSelector(selectSubjects);
  const tasks = useAppSelector(selectTasks);
  const busy = useAppSelector((state) => state.subjects.saving);
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState<Subject | 'new' | null>(null);
  const [removing, setRemoving] = useState<Subject | null>(null);
  const [error, setError] = useState('');
  async function remove() {
    if (!removing) return;
    try {
      await dispatch(deleteSubject(removing.id)).unwrap();
      dispatch(notify('Предмет удалён'));
      setRemoving(null);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Каждому заданию своё место"
        title="Твои предметы"
        description="Университет, курсы и самостоятельное обучение — всё здесь."
        action={
          <Button onClick={() => setEditing('new')}>
            <Icon name="plus" />
            Новый предмет
          </Button>
        }
      />
      {subjects.length ? (
        <div className="subjects-grid">
          {subjects.map((subject) => {
            const progress = getProgress(tasks.filter((task) => task.subjectId === subject.id));
            return (
              <article
                className="panel subject-card"
                key={subject.id}
                style={{ '--subject-color': subject.color } as React.CSSProperties}
              >
                <div className="subject-card-top">
                  <span className="large-subject-icon">
                    <Icon name="book" />
                  </span>
                  <div className="subject-card-actions">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Редактировать предмет ${subject.name}`}
                      onClick={() => setEditing(subject)}
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Удалить предмет ${subject.name}`}
                      title={
                        progress.total
                          ? 'Сначала перенесите или удалите задачи предмета'
                          : 'Удалить предмет'
                      }
                      disabled={progress.total > 0 || busy}
                      onClick={() => {
                        setError('');
                        setRemoving(subject);
                      }}
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </div>
                <h2>
                  <Link to={`/tasks?subject=${subject.id}`}>{subject.name}</Link>
                </h2>
                <p>{taskCount(progress.total)}</p>
                <Progress done={progress.done} total={progress.total} label="Выполнено" />
                <Link to={`/tasks?subject=${subject.id}`} className="subject-card-link">
                  Открыть задачи
                  <Icon name="arrow" />
                </Link>
              </article>
            );
          })}
          <button className="new-subject-card" onClick={() => setEditing('new')} type="button">
            <Icon name="plus" />
            <span>Добавить предмет</span>
          </button>
        </div>
      ) : (
        <section className="panel">
          <EmptyState
            title="Здесь начинается твой семестр"
            description="Добавь первый предмет. После этого можно будет записывать задания и следить за прогрессом."
            icon="book"
            action={
              <Button onClick={() => setEditing('new')}>
                <Icon name="plus" />
                Добавить предмет
              </Button>
            }
          />
        </section>
      )}
      {editing && (
        <SubjectDialog
          subject={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <ConfirmDialog
          title="Удалить предмет?"
          description={`«${removing.name}» будет удалён из списка предметов.`}
          confirmLabel="Удалить предмет"
          busy={busy}
          error={error}
          onConfirm={() => {
            void remove();
          }}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  );
}
