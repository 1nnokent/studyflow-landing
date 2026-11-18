import { ButtonLink, EmptyState } from '../components/ui';
export function NotFoundPage() {
  return (
    <EmptyState
      icon="search"
      title="Такой страницы нет"
      description="Возможно, задача была удалена или в ссылке есть опечатка. Вернёмся к твоему плану?"
      action={<ButtonLink to="/tasks">К списку задач</ButtonLink>}
    />
  );
}
