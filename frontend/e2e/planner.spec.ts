import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

test('создание предмета и задачи, сохранение, выполнение, редактирование и удаление', async ({
  page,
}) => {
  await page.goto('#/about');
  await page.getByRole('heading', { name: 'О StudyFlow' }).waitFor();
  await page.getByRole('button', { name: 'Начать с чистого плана' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Очистить план' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .locator('aside.sidebar')
    .getByRole('link', { name: 'Все задачи', exact: true })
    .click();
  await page.getByRole('link', { name: 'Добавить первую задачу' }).click();
  await page.getByRole('button', { name: 'Добавить задачу' }).click();
  await expect(page.getByText('Введите название задачи')).toBeVisible();
  await page.getByLabel('Название задачи', { exact: false }).fill('Подготовить доклад');
  await page
    .getByLabel('Описание', { exact: true })
    .fill('Прочитать материалы и собрать пять основных тезисов.');
  await page.getByRole('button', { name: 'Новый предмет', exact: true }).click();
  const subjectDialog = page.getByRole('dialog', { name: 'Новый предмет' });
  await subjectDialog.getByLabel('Название предмета', { exact: false }).fill('История');
  await subjectDialog.getByRole('radio', { name: 'Цвет 2', exact: true }).check();
  await subjectDialog.getByRole('button', { name: 'Добавить предмет', exact: true }).click();
  await expect(subjectDialog).toHaveCount(0);
  await expect(page.getByLabel('Предмет', { exact: true }).locator('option:checked')).toHaveText(
    'История',
  );
  await page.getByLabel('Срок выполнения', { exact: true }).fill('2026-12-01');
  await page.getByLabel('Приоритет', { exact: true }).selectOption('high');
  await page.getByRole('button', { name: 'Добавить задачу', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Подготовить доклад', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Подготовить доклад', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Прочитать материалы и собрать пять основных тезисов.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Отметить выполненной' }).click();
  await expect(page.locator('.detail-top .status-badge')).toHaveText('Выполнено');
  await page.getByRole('link', { name: 'Редактировать', exact: true }).click();
  await page.getByLabel('Название задачи', { exact: false }).fill('Подготовить доклад к пятнице');
  await page.getByRole('button', { name: 'Сохранить изменения' }).click();
  await expect(
    page.getByRole('heading', { name: 'Подготовить доклад к пятнице', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'К списку задач', exact: true }).click();
  await page.getByLabel('Поиск по названию').fill('доклад');
  await page.getByLabel('Статус', { exact: true }).selectOption('done');
  await expect(page.locator('.task-row')).toHaveCount(1);
  await page.getByRole('link', { name: 'Подготовить доклад к пятнице', exact: true }).click();
  await page.getByRole('button', { name: 'Удалить задачу', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Удалить задачу', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Начнём с одной задачи' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Начнём с одной задачи' })).toBeVisible();
});

test('резервная копия восстанавливает план, а некорректный файл не заменяет данные', async ({
  page,
}) => {
  await page.goto('#/about');
  await page.getByRole('heading', { name: 'О StudyFlow' }).waitFor();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать копию' }).click();
  const download = await downloadPromise;
  const file = await download.path();
  expect(file).toBeTruthy();
  const backup: string = await fs.readFile(file!, 'utf8');
  await page.getByRole('button', { name: 'Начать с чистого плана' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Очистить план' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const input = page.getByLabel('Импортировать резервную копию');
  await input.setInputFiles({
    name: 'studyflow.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup),
  });
  await page
    .getByRole('dialog', { name: 'Восстановить план из файла?' })
    .getByRole('button', { name: 'Восстановить план', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const before = await page.evaluate(() => localStorage.getItem('studyflow.workspace.v1'));
  await input.setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  });
  await expect(page.getByRole('alert')).toHaveText('Файл не содержит корректный JSON');
  expect(await page.evaluate(() => localStorage.getItem('studyflow.workspace.v1'))).toBe(before);
  await page
    .locator('aside.sidebar')
    .getByRole('link', { name: /^Все задачи/ })
    .click();
  await page.getByLabel('Поиск по названию').fill('Сверстать');
  await expect(
    page.getByRole('link', { name: 'Сверстать страницу проекта', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('link', { name: 'Сверстать страницу проекта', exact: true }),
  ).toBeVisible();
});

test('адаптивность, мобильная навигация и восстановление после ошибки загрузки', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await page.getByRole('heading', { name: 'Всё по плану.' }).waitFor();
  await page.screenshot({ path: testInfo.outputPath('dashboard-desktop.png'), fullPage: true });
  for (const width of [320, 390, 560, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
  const views = [
    ['#/', 'Всё по плану.', 'overview'],
    ['#/tasks', 'Все задачи', 'tasks'],
    ['#/tasks/new', 'Что добавим в план?', 'form'],
    ['#/subjects', 'Твои предметы', 'subjects'],
    ['#/about', 'О StudyFlow', 'about'],
    ['#/tasks/layout', 'Сверстать страницу проекта', 'detail'],
  ];
  for (const [route, title, name] of views) {
    await page.goto(route!);
    await page.getByRole('heading', { name: title!, exact: true }).waitFor();
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${name} at ${width}px`,
      ).toBeLessThanOrEqual(width);
    }
    if (['form', 'subjects', 'about', 'detail'].includes(name!))
      await page.screenshot({ path: testInfo.outputPath(`${name}-desktop.png`), fullPage: true });
  }
  await page.goto('#/');
  await page.getByRole('heading', { name: 'Всё по плану.', exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await expect(page.locator('.mobile-navigation')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.mobile-navigation')).not.toBeVisible();
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await page
    .locator('.mobile-navigation')
    .getByRole('link', { name: /^Все задачи/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Все задачи', exact: true })).toBeVisible();
  await expect(page.locator('.mobile-navigation')).not.toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('tasks-mobile.png'), fullPage: true });
  await page.evaluate(() => localStorage.setItem('studyflow.workspace.v1', '{broken'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Не получилось открыть план' })).toBeVisible();
  await page.getByRole('button', { name: 'Начать новый план', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Начать новый план', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Начнём с одной задачи' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Начнём с одной задачи' })).toBeVisible();
  expect(errors).toEqual([]);
});
