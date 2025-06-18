
import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, ShieldAlert, CheckCircle } from 'lucide-react';

interface TasksSectionProps {
  currentLeagueName: string;
}

// Placeholder tasks
const leagueTasks: Record<string, Array<{ id: string; description: string; completed: boolean }>> = {
  Bronze: [
    { id: 'b1', description: 'Набери 1,000 монет', completed: false },
    { id: 'b2', description: 'Кликни 500 раз', completed: false },
  ],
  Silver: [
    { id: 's1', description: 'Достигни Силы Клика 5', completed: false },
    { id: 's2', description: 'Разблокируй Золотую Лигу', completed: false },
  ],
  Gold: [{ id: 'g1', description: 'Собери 1,000,000 монет', completed: true }],
  // Add more tasks for other leagues
};

const TasksSection: React.FC<TasksSectionProps> = ({ currentLeagueName }) => {
  const tasks = leagueTasks[currentLeagueName] || [{ id: 'd1', description: 'Пока нет заданий для вашей лиги.', completed: false}];

  return (
    <Card className="mt-8 bg-card/70 border-border/40 shadow-md text-left">
      <CardHeader>
        <div className="flex items-center">
          <ListChecks className="w-6 h-6 mr-2 text-primary" />
          <CardTitle className="text-xl">Задания Лиги: {currentLeagueName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <ul className="space-y-3">
            {tasks.map(task => (
              <li key={task.id} className={`flex items-center p-3 rounded-md ${task.completed ? 'bg-green-500/10' : 'bg-muted/30'}`}>
                {task.completed ? <CheckCircle className="w-5 h-5 mr-3 text-green-500" /> : <ShieldAlert className="w-5 h-5 mr-3 text-yellow-500" />}
                <span className={task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                  {task.description}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Для вашей текущей лиги пока нет заданий.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TasksSection;
