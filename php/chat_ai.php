<?php

// HTTP Basic Authentication
$valid_username = 'admin';
$valid_password = 'admin';

if (!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW']) ||
    $_SERVER['PHP_AUTH_USER'] !== $valid_username || $_SERVER['PHP_AUTH_PW'] !== $valid_password) {
    header('WWW-Authenticate: Basic realm="Restricted Area"');
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Accès non autorisé.']);
    exit;
}

// Set the content type to application/json for all valid responses
header('Content-Type: application/json');

// Include the data manager
require_once __DIR__ . '/data_manager.php';

// --- AI Configuration ---
define("AI_SYSTEM_PROMPT", "Vous êtes un agent conversationnel spécialisé dans l'accompagnement des enseignants pour la mise en place de ressources pédagogiques inclusives. Votre mission est d'aider l'enseignant à clarifier sa situation, ses besoins et les caractéristiques de ses élèves.
Style de dialogue :
- Utilisez toujours 'vous'.
- Posez des questions ouvertes pour encourager la réflexion.
- Ne donnez jamais de conseils directs, mais aidez l'utilisateur à explorer ses propres idées.
- Si l'utilisateur demande un conseil, répondez : \"Je suis ici pour vous aider à explorer la situation. Pour l'instant, continuons à clarifier les éléments.\"
- Utilisez le Markdown pour mettre en **gras** les mots-clés importants dans vos réponses (par exemple, \"Parlez-moi de la **situation** avec cet **élève**.\").
- Essayez de poser une seule question à la fois.
Format de résumé (déclenché par \"résume je débug\") :
[résumé] Votre objectif est de [objectif principal]. Vous avez identifié [éléments clés déjà mentionnés]. Les **pistes** actuelles incluent [pistes possibles]. [/résumé]
");

define("USER_ID", "default_teacher");

/**
 * Loads conversation history for a user and transforms it into the required format.
 *
 * @param string $userId The identifier for the user.
 * @return array The conversation history.
 */
function load_conversation_history(string $userId): array {
    $dataDir = __DIR__ . '/../data';
    $filename = $dataDir . '/conversation_history_' . preg_replace('/[^a-zA-Z0-9_-]/', '', $userId) . '.json';

    if (!file_exists($filename)) {
        return [];
    }

    $jsonContent = file_get_contents($filename);
    if ($jsonContent === false || empty($jsonContent)) {
        return [];
    }

    $history = json_decode($jsonContent, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($history)) {
        error_log("Corrupted or invalid JSON in conversation history file: " . $filename . ". Error: " . json_last_error_msg());
        return []; // Start fresh if history is corrupt or not an array
    }

    $formatted_history = [];
    foreach ($history as $turn) {
        if (isset($turn['user']) && isset($turn['ai'])) {
            $formatted_history[] = ['role' => 'user', 'content' => $turn['user']];
            $formatted_history[] = ['role' => 'assistant', 'content' => $turn['ai']];
        }
    }
    return $formatted_history;
}

/**
 * Generates a mock AI response based on user message, history, and system rules.
 *
 * @param string $user_message The user's current message.
 * @param array $conversation_history The past conversation.
 * @param string $system_prompt_rules The AI's persona and rules.
 * @return string The AI's generated reply.
 */
function get_mock_ai_response(string $user_message, array $conversation_history, string $system_prompt_rules): string {
    $lower_user_message = strtolower(trim($user_message));

    // Rule: Summary Trigger
    if ($lower_user_message === "résume je débug") {
        // Extract some keywords from history for a more dynamic summary if possible
        $objective = "débugger une application complexe";
        $elements = "erreurs intermittentes lors de la montée en charge";
        $tracks = "possible fuite mémoire ou un problème de concurrence";
        // This is a placeholder; a more complex logic would parse history
        return "[résumé] Votre objectif est de **{$objective}** qui présente des **{$elements}**. Vous avez déjà tenté d'analyser les **logs** et de reproduire le **problème** en environnement de **test**, mais sans succès jusqu'à présent. Les **pistes** actuelles incluent une possible **{$tracks}** dans le module de **traitement des données**. [/résumé]";
    }

    // Rule: No direct advice
    if (preg_match('/(donne-moi un conseil|que dois-je faire|conseillez-moi)/i', $lower_user_message)) {
        return "Je suis ici pour vous aider à explorer la **situation**. Pour l'instant, continuons à clarifier les **éléments**.";
    }
    
    // Rule: Initial Interaction
    if (count($conversation_history) < 2) { // Very short history
        return "Bonjour ! Je suis votre agent conversationnel spécialisé dans les **ressources pédagogiques inclusives**. Pour commencer, pourriez-vous me décrire brièvement la **situation** qui vous amène à me solliciter ?";
    }

    // Rule: Contextual Follow-up (Simplified)
    if (preg_match('/\b(classe|niveau|établissement)\b/i', $lower_user_message)) {
        return "Pourriez-vous m'en dire plus sur le contexte de la **classe** (par exemple: matière, **niveau**, type d'**établissement**) ?";
    }
    if (preg_match('/\b(besoins spécifiques|stratégies)\b/i', $lower_user_message)) {
        return "Quels sont les **besoins spécifiques** des **élèves** que vous avez identifiés et quelles **stratégies** avez-vous déjà mises en place ?";
    }
    if (preg_match('/\b(élève|étudiant)\b/i', $lower_user_message)) {
        return "Parlez-moi de la **situation** avec cet **élève**.";
    }


    // Generic Responses
    $generic_responses = [
        "C'est noté. Pourriez-vous préciser davantage votre **pensée** ?",
        "Comment cela affecte-t-il votre **pratique professionnelle** ?",
        "Quels sont les **aspects** les plus importants de cette **situation** pour vous ?",
        "Qu'avez-vous déjà tenté ou envisagé par rapport à cela ?"
    ];
    // Select a generic response, ensuring it's different from the last AI response if possible
    $last_ai_response = "";
    if (!empty($conversation_history)) {
        $last_turn = end($conversation_history);
        if ($last_turn['role'] === 'assistant') {
            $last_ai_response = $last_turn['content'];
        }
    }
    
    $chosen_response = $generic_responses[array_rand($generic_responses)];
    $attempts = 0;
    while ($chosen_response === $last_ai_response && $attempts < count($generic_responses)) {
        $chosen_response = $generic_responses[array_rand($generic_responses)];
        $attempts++;
    }
    return $chosen_response;
}

// --- Main Script Logic ---
$response = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    if (isset($data['message']) && !empty(trim($data['message']))) {
        $user_message = trim($data['message']);
        
        $conversation_history = load_conversation_history(USER_ID);
        
        $ai_reply = get_mock_ai_response($user_message, $conversation_history, AI_SYSTEM_PROMPT);
        
        $response['reply'] = $ai_reply;

        if (!save_conversation_turn(USER_ID, $user_message, $ai_reply)) {
            error_log("Failed to save conversation turn for user: " . USER_ID);
            // Continue to send response to user even if saving fails
        }

    } else {
        http_response_code(400); // Bad Request
        $response['error'] = "Aucun message reçu ou message vide.";
    }
} else {
    http_response_code(405); // Method Not Allowed
    $response['error'] = "Méthode non autorisée. Seules les requêtes POST sont acceptées.";
}

// Send the JSON response
echo json_encode($response);
?>
