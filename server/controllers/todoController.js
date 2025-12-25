const Todo = require('../models/todoModel');

// @desc    Get user todos
// @route   GET /api/todos
// @access  Private
const getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Returning ${todos.length} todos to user ${req.user.id}`);
    res.status(200).json(todos);
  } catch (error) {
    console.error('Error in getTodos:', error);
    res.status(500).json({
      message: 'Error fetching todos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create a todo
// @route   POST /api/todos
// @access  Private
const createTodo = async (req, res) => {
  try {
    const { text, dueDate, status } = req.body;

    // Validate input
    if (!text) {
      return res.status(400).json({
        message: 'Please add a text field',
        fields: {
          text: 'Text is required'
        }
      });
    }

    // Validate dueDate if provided
    if (dueDate) {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          message: 'Invalid due date format',
          fields: {
            dueDate: 'Please provide a valid date'
          }
        });
      }
    }

    const todoData = {
      text,
      user: req.user.id,
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(status && { status })
    };

    console.log('Creating todo with data:', {
      ...todoData,
      user: req.user.id
    });

    const todo = await Todo.create(todoData);
    console.log('Created todo:', todo);

    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({
      message: 'Error creating todo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update a todo
// @route   PUT /api/todos/:id
// @access  Private
const updateTodo = async (req, res) => {
  try {
    const { text, dueDate, completed, status } = req.body;
    console.log('Update todo request - ID:', req.params.id, 'Body:', req.body);

    // Find todo
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Check if todo belongs to user
    if (todo.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Validate dueDate if provided
    if (dueDate) {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          message: 'Invalid due date format',
          fields: {
            dueDate: 'Please provide a valid date'
          }
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (completed !== undefined) updateData.completed = completed;
    if (status !== undefined) updateData.status = status;

    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('Updated todo:', updatedTodo);
    res.status(200).json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({
      message: 'Error updating todo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete a todo
// @route   DELETE /api/todos/:id
// @access  Private
const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Check if todo belongs to user
    if (todo.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await todo.deleteOne();
    console.log(`Deleted todo ${req.params.id} for user ${req.user.id}`);

    res.status(200).json({
      message: 'Todo deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({
      message: 'Error deleting todo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
}; 