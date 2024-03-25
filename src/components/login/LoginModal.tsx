import React from "react";
import { useForm } from "react-hook-form";

type LoginFormInputs = {
  username: string;
  password: string;
};

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const { register, handleSubmit } = useForm<LoginFormInputs>();

  const onSubmit = (data: LoginFormInputs) => {
    // Handle login logic here
    console.log(data);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div className="bg-white p-6 rounded shadow-lg z-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            {...register("username")}
            className="block w-full p-2 border border-gray-300 rounded"
          />

          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            {...register("password")}
            className="block w-full p-2 border border-gray-300 rounded"
          />

          <div className="flex justify-end space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Login
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
