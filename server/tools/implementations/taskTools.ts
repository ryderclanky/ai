import type { ToolDefinition } from '../ToolRegistry.js';
import TaskService from '../../services/TaskService.js';

const taskService = new TaskService();

export const taskTools: ToolDefinition[] = [
  {
    name: 'create_task',
    description: 'Create a new task in the task list',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'done', 'waiting'], description: 'Task status' },
        note: { type: 'string', description: 'Optional note or context for the task' },
      },
      required: ['title'],
    },
    risk_level: 'SAFE_AUTO',
    handler: async (params) => {
      const title = params.title as string;
      const status = (params.status as string) || 'todo';
      const note = params.note as string | undefined;
      const task = taskService.create(title, status, note);
      return { success: true, task };
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task status or note',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
        title: { type: 'string', description: 'New task title' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'done', 'waiting'], description: 'New status' },
        note: { type: 'string', description: 'Updated note' },
      },
      required: ['id'],
    },
    risk_level: 'SAFE_AUTO',
    handler: async (params) => {
      const id = params.id as string;
      const task = taskService.update(id, {
        title: params.title as string | undefined,
        status: params.status as string | undefined,
        note: params.note as string | undefined,
      });
      if (!task) return { success: false, error: 'Task not found' };
      return { success: true, task };
    },
  },
];
