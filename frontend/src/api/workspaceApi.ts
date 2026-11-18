import type { Subject, SubjectInput, Task, TaskInput, Workspace } from '../domain/types';
import { validateSubject, validateTask } from '../domain/validation';
import { parseWorkspace } from '../domain/workspace';
import { demoWorkspace } from '../data/demo';

export const STORAGE_KEY = 'studyflow.workspace.v1';
export interface WorkspaceApi {
  load(): Promise<Workspace>;
  createTask(input: TaskInput): Promise<Task>;
  updateTask(id: string, changes: Partial<TaskInput>): Promise<Task>;
  deleteTask(id: string): Promise<string>;
  createSubject(input: SubjectInput): Promise<Subject>;
  updateSubject(id: string, input: SubjectInput): Promise<Subject>;
  deleteSubject(id: string): Promise<string>;
  replace(document: Workspace): Promise<Workspace>;
}
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;

export function createLocalWorkspaceApi(
  options: { storage?: () => StorageAccess; delayMs?: number } = {},
): WorkspaceApi {
  const storage = options.storage ?? (() => window.localStorage);
  const wait = () => new Promise<void>((resolve) => setTimeout(resolve, options.delayMs ?? 180));
  function save(document: Workspace): void {
    try {
      storage().setItem(STORAGE_KEY, JSON.stringify(document));
    } catch {
      throw new Error(
        'Не удалось сохранить изменения. Проверьте, разрешено ли браузеру хранить данные и достаточно ли свободного места.',
      );
    }
  }
  function read(): Workspace {
    let raw: string | null;
    try {
      raw = storage().getItem(STORAGE_KEY);
    } catch {
      throw new Error(
        'Хранилище браузера недоступно. Разрешите хранение данных и попробуйте снова.',
      );
    }
    if (raw === null) {
      const demo = demoWorkspace();
      save(demo);
      return demo;
    }
    try {
      return parseWorkspace(raw);
    } catch {
      throw new Error(
        'Сохранённый план повреждён или имеет неподдерживаемый формат. Можно повторить загрузку или начать новый план.',
      );
    }
  }
  async function change<T>(mutate: (document: Workspace) => T): Promise<T> {
    await wait();
    const document = read();
    const result = mutate(document);
    document.updatedAt = new Date().toISOString();
    save(document);
    return result;
  }
  function checkTask(input: TaskInput, subjects: Subject[]) {
    const error = Object.values(validateTask(input, subjects))[0];
    if (error) throw new Error(error);
  }
  return {
    async load() {
      await wait();
      return read();
    },
    createTask(input) {
      return change((document) => {
        checkTask(input, document.subjects);
        const now = new Date().toISOString();
        const task: Task = {
          ...input,
          title: input.title.trim(),
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        document.tasks.push(task);
        return task;
      });
    },
    updateTask(id, changes) {
      return change((document) => {
        const index = document.tasks.findIndex((task) => task.id === id);
        const previous = document.tasks[index];
        if (!previous) throw new Error('Задача не найдена. Обновите страницу.');
        const task = { ...previous, ...changes, updatedAt: new Date().toISOString() };
        task.title = task.title.trim();
        checkTask(task, document.subjects);
        document.tasks[index] = task;
        return task;
      });
    },
    deleteTask(id) {
      return change((document) => {
        if (!document.tasks.some((task) => task.id === id)) throw new Error('Задача уже удалена');
        document.tasks = document.tasks.filter((task) => task.id !== id);
        return id;
      });
    },
    createSubject(input) {
      return change((document) => {
        const error = Object.values(validateSubject(input, document.subjects))[0];
        if (error) throw new Error(error);
        const subject = {
          ...input,
          name: input.name.trim(),
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        document.subjects.push(subject);
        return subject;
      });
    },
    updateSubject(id, input) {
      return change((document) => {
        const subject = document.subjects.find((entry) => entry.id === id);
        if (!subject) throw new Error('Предмет не найден');
        const error = Object.values(validateSubject(input, document.subjects, id))[0];
        if (error) throw new Error(error);
        Object.assign(subject, { ...input, name: input.name.trim() });
        return subject;
      });
    },
    deleteSubject(id) {
      return change((document) => {
        if (!document.subjects.some((subject) => subject.id === id))
          throw new Error('Предмет не найден');
        if (document.tasks.some((task) => task.subjectId === id))
          throw new Error('Сначала перенесите или удалите задачи этого предмета');
        document.subjects = document.subjects.filter((subject) => subject.id !== id);
        return id;
      });
    },
    async replace(document) {
      await wait();
      const valid = parseWorkspace(JSON.stringify(document));
      save(valid);
      return valid;
    },
  };
}
