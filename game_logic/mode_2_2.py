class WordlyGame:
    def __init__(self):
        self.players = {}  # session_id -> word
        self.words = {}  # session_id -> word
        self.turn_order = []
        self.current_turn = 0
        self.last_guess = None
        self.game_over = False

    def add_player(self, session_id):
        if session_id not in self.players:
            self.players[session_id] = None
            self.turn_order.append(session_id)

    def submit_word(self, session_id, word):
        self.words[session_id] = word.lower()
        all_submitted = len(self.words) == len(self.players)
        return all_submitted

    def make_guess(self, session_id, guess):
        if self.turn_order[self.current_turn] != session_id:
            return {"error": "Not your turn"}

        opponent_id = next(pid for pid in self.players if pid != session_id)
        self.last_guess = {
            "guess": guess.lower(),
            "opponent_id": opponent_id,
            "player": session_id
        }
        return self.last_guess

    def evaluate_guess(self, evaluation):
        if not self.last_guess:
            return None

        guesser_id = self.last_guess["player"]
        opponent_id = self.last_guess["opponent_id"]

        # Check if correct (5 greens)
        if all(state == "green" for state in evaluation):
            self.game_over = True
            return {
                "winner": guesser_id,
                "words": self.words
            }

        # Если не угадал, следующий ход
        self.current_turn = (self.current_turn + 1) % len(self.turn_order)
        return {
            "current_turn": self.turn_order[self.current_turn]
        }
