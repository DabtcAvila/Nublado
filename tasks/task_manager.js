class TaskManager {
  constructor() {
    this.tasks = [];
    this.completedTasks = [];
    this.taskIdCounter = 1;
  }

  createTask(name, description, priority = 'normal') {
    const task = {
      id: this.taskIdCounter++,
      name,
      description,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    this.tasks.push(task);
    return task;
  }

  updateTaskStatus(taskId, status) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date().toISOString();
        this.completedTasks.push(task);
        this.tasks = this.tasks.filter(t => t.id !== taskId);
      }
      return task;
    }
    return null;
  }

  getTasks(status = null) {
    if (status) {
      return this.tasks.filter(t => t.status === status);
    }
    return this.tasks;
  }

  getTaskStats() {
    return {
      pending: this.tasks.filter(t => t.status === 'pending').length,
      inProgress: this.tasks.filter(t => t.status === 'in_progress').length,
      completed: this.completedTasks.length,
      total: this.tasks.length + this.completedTasks.length
    };
  }
}

module.exports = TaskManager;