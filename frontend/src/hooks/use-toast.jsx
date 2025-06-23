import * as React from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 3000; // 3 seconds

// Action types for reducer
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

// Generate unique IDs for toasts
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

// Store of timeouts for removing toasts
const toastTimeouts = new Map();

// Reducer for toast state
const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }

    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
};

// State management
const listeners = [];
let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// Function to create a toast
function toast({ ...props }) {
  const id = genId();

  const update = (props) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });

  // Clear any existing timeouts for this toast
  const clearToastTimeout = (toastId) => {
    if (toastTimeouts.has(toastId)) {
      clearTimeout(toastTimeouts.get(toastId));
      toastTimeouts.delete(toastId);
    }
  };

  // Dismiss function - handles both auto and manual dismissal
  const dismiss = () => {
    // Clear any existing timeouts
    clearToastTimeout(id);

    // Mark toast as closed
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

    // Set timeout for removing the toast after animation
    const timeout = setTimeout(() => {
      dispatch({ type: actionTypes.REMOVE_TOAST, toastId: id });
    }, 300); // Animation duration

    toastTimeouts.set(id, timeout);
  };

  // Create the toast
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Auto-dismiss after delay
  const timeout = setTimeout(dismiss, TOAST_REMOVE_DELAY);
  toastTimeouts.set(id, timeout);

  return {
    id,
    dismiss,
    update,
  };
}

// Hook for components to use toast
function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId) => {
      // Clear any existing timeouts
      if (toastTimeouts.has(toastId)) {
        clearTimeout(toastTimeouts.get(toastId));
        toastTimeouts.delete(toastId);
      }

      // Mark toast as closed
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId });

      // Set timeout for removing the toast after animation
      const timeout = setTimeout(() => {
        dispatch({ type: actionTypes.REMOVE_TOAST, toastId });
      }, 300); // Animation duration

      toastTimeouts.set(toastId, timeout);
    },
  };
}

export { useToast, toast, reducer };
