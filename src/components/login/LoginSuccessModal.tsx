import React, { useState } from "react";

const LoginSuccessModal: React.FC = () => {
  const [showModal, setShowModal] = useState(true);

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          data-testid="login-success-modal"
        >
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Login Successful!</h2>
            <p className="text-gray-600 mb-4">
              You have successfully logged in.
            </p>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={closeModal}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginSuccessModal;
