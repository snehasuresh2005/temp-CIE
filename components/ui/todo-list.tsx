import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { CheckSquare, Square, Plus, Trash2, Clock } from 'lucide-react';

interface TodoItem {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  createdAt: Date;
}

interface TodoListProps {
  role?: 'admin' | 'faculty' | 'student';
}

export function TodoList({ role = 'admin' }: TodoListProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTask, setNewTask] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const storageKey = `cie-${role}-todos`;

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos).map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt)
        }));
        setTodos(parsedTodos);
      } catch (error) {
        console.error('Error parsing saved todos:', error);
      }
    }
  }, [storageKey]);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(todos));
      sessionStorage.setItem(storageKey, JSON.stringify(todos));
    }
  }, [todos, storageKey]);

  const addTodo = () => {
    if (newTask.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: newTask.trim(),
        priority: selectedPriority,
        completed: false,
        createdAt: new Date()
      };
      setTodos([newTodo, ...todos]);
      setNewTask('');
      setSelectedPriority('medium');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    
    // Update storage
    if (updatedTodos.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(updatedTodos));
      sessionStorage.setItem(storageKey, JSON.stringify(updatedTodos));
    } else {
      // Clear storage if no todos left
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  return (
    <Card className="todo-list-card transform hover:scale-105 focus:scale-105 transition-transform duration-200">
      <CardHeader>
        <CardTitle className="text-xl">To-Do List</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          {/* Add new task */}
          <div className="flex items-baseline gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as 'high' | 'medium' | 'low')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <Button onClick={addTodo} size="sm" className="px-3">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Todo list */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {todos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks yet</p>
                <p className="text-xs mt-1">Add your first task above</p>
              </div>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                    todo.completed 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className="flex-shrink-0"
                  >
                    {todo.completed ? (
                      <CheckSquare className="h-5 w-5 text-green-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {todo.text}
                      </p>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-lg">
                          <div className={`w-4 h-4 rounded-full ${getPriorityIcon(todo.priority)}`}></div>
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTime(todo.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 