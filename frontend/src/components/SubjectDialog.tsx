import { useState, type FormEvent } from 'react';
import { selectSubjects, useAppDispatch, useAppSelector } from '../app/store';
import { createSubject, errorMessage, updateSubject } from '../state/actions';
import { notify } from '../state/uiSlice';
import { SUBJECT_COLORS, type Subject, type SubjectInput } from '../domain/types';
import { validateSubject } from '../domain/validation';
import { Button, Dialog, Field } from './ui';
import { Icon } from './Icon';

export function SubjectDialog({
  subject,
  onClose,
  onSaved,
}: {
  subject?: Subject;
  onClose: () => void;
  onSaved?: (subject: Subject) => void;
}) {
  const dispatch = useAppDispatch();
  const subjects = useAppSelector(selectSubjects);
  const saving = useAppSelector((state) => state.subjects.saving);
  const [name, setName] = useState(subject?.name ?? '');
  const [color, setColor] = useState(subject?.color ?? SUBJECT_COLORS[0]!);
  const [errors, setErrors] = useState<Partial<Record<keyof SubjectInput, string>>>({});
  const [requestError, setRequestError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    const input = { name, color };
    const nextErrors = validateSubject(input, subjects, subject?.id);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById('subject-name')?.focus();
      return;
    }
    setRequestError('');
    try {
      const result = subject
        ? await dispatch(updateSubject({ id: subject.id, input })).unwrap()
        : await dispatch(createSubject(input)).unwrap();
      dispatch(notify(subject ? 'Предмет обновлён' : 'Предмет добавлен'));
      onSaved?.(result);
      onClose();
    } catch (error) {
      setRequestError(errorMessage(error));
    }
  }
  return (
    <Dialog
      title={subject ? 'Редактировать предмет' : 'Новый предмет'}
      onClose={() => {
        if (!saving) onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        noValidate
      >
        <Field id="subject-name" label="Название предмета" required error={errors.name}>
          <input
            id="subject-name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            placeholder="Например, история искусства"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'subject-name-error' : undefined}
            disabled={saving}
          />
        </Field>
        <fieldset className="color-field">
          <legend>Цвет предмета</legend>
          <div className="color-options">
            {SUBJECT_COLORS.map((option, index) => (
              <label key={option} style={{ '--swatch': option } as React.CSSProperties}>
                <input
                  type="radio"
                  name="subject-color"
                  value={option}
                  checked={color === option}
                  onChange={() => setColor(option)}
                  aria-label={`Цвет ${index + 1}`}
                  disabled={saving}
                />
                <span>{color === option && <Icon name="check" />}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {requestError && (
          <p className="error-message" role="alert">
            {requestError}
          </p>
        )}
        <div className="dialog-actions">
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
          <Button busy={saving} type="submit">
            {subject ? 'Сохранить' : 'Добавить предмет'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
