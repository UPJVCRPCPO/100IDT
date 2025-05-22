document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const chatContainer = document.getElementById('chat-container'); // For scrolling

    // Helper function to display messages
    function displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);

        if (sender === 'ai') {
            // For AI messages, replace Markdown bold with <strong> HTML tags
            const processedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            messageElement.innerHTML = processedMessage; // Use innerHTML to render the HTML
        } else {
            // For user messages, display as plain text to prevent HTML injection
            messageElement.textContent = message;
        }

        chatMessages.appendChild(messageElement);
        // Scroll to the bottom of the chat messages
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to handle sending a message
    async function sendMessage() {
        const messageText = messageInput.value.trim();

        if (messageText === '') {
            return; // Don't send empty messages
        }

        // Display user's message
        displayMessage(messageText, 'user');
        const currentMessage = messageText; // Store message before clearing input
        messageInput.value = ''; // Clear input field

        // Send message to the backend
        try {
            const response = await fetch('../php/chat_ai.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: currentMessage })
            });

            if (!response.ok) {
                // Display an error message if the HTTP request itself failed
                const errorText = `Erreur: ${response.status} ${response.statusText}`;
                displayMessage(`Désolé, je n'ai pas pu me connecter à l'IA. ${errorText}`, 'ai');
                console.error('Failed to send message:', response);
                return;
            }

            const data = await response.json();

            if (data && data.reply) {
                displayMessage(data.reply, 'ai');
            } else if (data && data.error) {
                displayMessage(`Erreur de l'IA: ${data.error}`, 'ai');
                console.error('AI Error:', data.error);
            } else {
                 displayMessage("Désolé, j'ai reçu une réponse inattendue de l'IA.", 'ai');
                 console.error('Unexpected response from AI:', data);
            }

        } catch (error) {
            // Display an error message if the fetch operation itself fails (e.g., network error)
            displayMessage("Désolé, je n'ai pas pu joindre l'IA. Veuillez vérifier votre connexion.", 'ai');
            console.error('Error sending message:', error);
        }
    }

    // Event listener for the send button
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // Event listener for the 'Enter' key in the input field
    if (messageInput) {
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission (if it were in a form)
                sendMessage();
            }
        });
    }

    // Initial greeting from AI (optional, can be moved to backend logic later)
    // displayMessage("Bonjour ! Comment puis-je vous aider aujourd'hui ?", 'ai');
});
