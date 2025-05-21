<?php
// Set the content type to application/json
header('Content-Type: application/json');

// Include the data manager
require_once __DIR__ . '/data_manager.php';

// Initialize response array
$response = [];

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the input data (JSON string)
    $json_data = file_get_contents('php://input');
    // Decode the JSON data into a PHP associative array
    $data = json_decode($json_data, true);

    // Check if 'message' is present and not empty
    if (isset($data['message']) && !empty(trim($data['message']))) {
        $user_message = trim($data['message']);

        // Simple AI logic
        if (strtolower($user_message) === 'bonjour') {
            $ai_reply = "Bonjour! Comment puis-je vous aider aujourd'hui?";
        } elseif (stripos($user_message, 'élève') !== false) {
            $ai_reply = "Parlez-moi de la situation avec cet élève.";
        } else {
            $ai_reply = "Message reçu: " . htmlspecialchars($user_message);
        }
        $response['reply'] = $ai_reply;

        // Save the conversation turn
        // For now, using a static userId. This can be dynamic in a real application.
        $userId = "default_teacher";
        if (!save_conversation_turn($userId, $user_message, $ai_reply)) {
            // Log error or handle if saving fails, but don't stop the user response
            error_log("Failed to save conversation turn for user: " . $userId);
        }

    } else {
        // No message or empty message received
        http_response_code(400); // Bad Request
        $response['error'] = "Aucun message reçu ou message vide.";
    }
} else {
    // Request method is not POST
    http_response_code(405); // Method Not Allowed
    $response['error'] = "Méthode non autorisée. Seules les requêtes POST sont acceptées.";
}

// Send the JSON response
echo json_encode($response);
?>
