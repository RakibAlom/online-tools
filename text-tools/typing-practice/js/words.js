// ===================== WORD LISTS & TEXT GENERATOR =====================
const WORDS = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
    "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their",
    "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just",
    "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now",
    "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well",
    "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "great", "between", "need", "large",
    "often", "hand", "high", "place", "hold", "turn", "help", "line", "world", "own", "life", "few", "program", "city", "never",
    "example", "begin", "run", "story", "cut", "young", "talk", "soon", "list", "book", "very", "real", "move", "play", "small",
    "number", "always", "next", "near", "head", "light", "country", "right", "black", "body", "music", "color", "stand", "sun",
    "question", "area", "car", "long", "rock", "surface", "food", "learn", "plant", "cover", "farm", "thought", "across", "today",
    "during", "short", "best", "hour", "stop", "south", "bring", "east", "west", "blue", "gold", "green", "water", "air", "tree",
    "road", "door", "face", "form", "street", "boat", "late", "fast", "slow", "hard", "easy", "full", "open", "old", "big", "keep",
    "start", "same", "show", "such", "try", "call", "while", "last", "let", "feel", "seem", "ask", "late", "those", "here", "every",
    "come", "free", "down", "mean", "right", "still", "past", "open", "long", "five", "walk", "side", "study", "away", "home", "find",
    "more", "read", "write", "love", "live", "true", "once", "each", "until", "clear", "idea", "might", "group", "hand", "same",
    "real", "done", "many", "watch", "end", "below", "city", "kind", "off", "word", "point", "name", "state", "second", "child",
    "three", "set", "part", "leave", "student", "follow", "stop", "force", "change", "become", "different", "move", "turn", "face"
];

const QUOTES = [
    { text: "The only way to do great work is to love what you do. If you have not found it yet keep looking.", author: "Steve Jobs" },
    { text: "In the middle of every difficulty lies opportunity. The harder the struggle the more glorious the triumph.", author: "Albert Einstein" },
    { text: "It does not matter how slowly you go as long as you do not stop moving forward with determination.", author: "Confucius" },
    { text: "Success is not final and failure is not fatal it is the courage to continue that counts the most.", author: "Winston Churchill" },
    { text: "The future belongs to those who believe in the beauty of their dreams and work toward them.", author: "Eleanor Roosevelt" },
    { text: "It always seems impossible until it is done and you have proved to everyone that you could do it.", author: "Nelson Mandela" },
    { text: "You miss one hundred percent of the shots you do not take so always try your best effort.", author: "Wayne Gretzky" },
    { text: "Life is what happens when you are busy making other plans so live in the present moment always.", author: "John Lennon" },
    { text: "Whether you think you can or you think you cannot either way you are absolutely right about it.", author: "Henry Ford" },
    { text: "The journey of a thousand miles begins with one single step taken in the right direction forward.", author: "Lao Tzu" },
    { text: "That which does not kill us makes us stronger and better prepared for the challenges ahead of us.", author: "Friedrich Nietzsche" },
    { text: "In the end it is not the years in your life that count but the life in your years.", author: "Abraham Lincoln" },
    { text: "Strive not to be a success but rather to be of value to the people around you every day.", author: "Albert Einstein" },
    { text: "The mind is everything and what you think you become so always think positive and constructive thoughts.", author: "Buddha" },
    { text: "An unexamined life is not worth living so take the time to reflect and know yourself deeply.", author: "Socrates" },
    { text: "Spread love everywhere you go and let no one ever come to you without leaving happier than before.", author: "Mother Teresa" },
    { text: "When you reach the end of your rope tie a knot in it and hang on with everything you have.", author: "Franklin Roosevelt" },
    { text: "Always remember that you are absolutely unique just like everyone else on this entire planet Earth.", author: "Margaret Mead" },
    { text: "Do not go where the path may lead go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
    { text: "The greatest glory in living lies not in never falling but in rising every time we fall down.", author: "Nelson Mandela" },
    { text: "You will face many defeats in life but never let yourself be defeated by any of them completely.", author: "Maya Angelou" },
    { text: "Believe you can and you are halfway there to achieving everything you have ever dreamed of reaching.", author: "Theodore Roosevelt" },
    { text: "I have not failed I have just found ten thousand ways that do not work and I keep going.", author: "Thomas Edison" },
    { text: "Everything you have ever wanted is on the other side of fear so push through and keep going.", author: "George Addair" },
    { text: "The secret of getting ahead is getting started no matter how small your first step might be.", author: "Mark Twain" }
];

const PUNCT_WORDS = [
    "however", "therefore", "although", "meanwhile", "furthermore", "consequently", "nevertheless", "ultimately",
    "specifically", "particularly", "significantly", "approximately", "immediately", "subsequently", "occasionally"
];

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function addPunctuation(words) {
    const result = [];
    let sentenceLen = 0;
    const targetLen = Math.floor(Math.random() * 6) + 5;
    for (let i = 0; i < words.length; i++) {
        let w = words[i];
        sentenceLen++;
        if (sentenceLen >= targetLen && i < words.length - 1) {
            const r = Math.random();
            if (r < 0.5) w += '.';
            else if (r < 0.7) w += ',';
            else if (r < 0.8) w += '!';
            else if (r < 0.9) w += ';';
            else w += ':';
            sentenceLen = 0;
        } else if (Math.random() < 0.1 && sentenceLen > 2) {
            w += ',';
            sentenceLen = 0;
        }
        result.push(w);
    }
    return result;
}

function addNumbers(words) {
    return words.map(w => {
        if (Math.random() < 0.15) {
            return Math.floor(Math.random() * 1000).toString();
        }
        return w;
    });
}

const TextGenerator = {
    generate(mode, subMode, options = {}) {
        const { punctuation = false, numbers = false, customText = '' } = options;

        if (mode === 'custom') {
            if (!customText.trim()) return 'type your custom text here and press restart to begin';
            return customText.trim();
        }

        if (mode === 'quote') {
            return this.getQuoteText(subMode || 'medium');
        }

        let count = 200;
        if (mode === 'words') {
            count = parseInt(subMode) || 50;
        } else if (mode === 'time') {
            const t = parseInt(subMode) || 60;
            count = Math.max(200, t * 4);
        }

        let pool = shuffle(WORDS);
        let wordList = [];
        while (wordList.length < count) {
            wordList = wordList.concat(shuffle(pool));
        }
        wordList = wordList.slice(0, count);

        if (numbers) wordList = addNumbers(wordList);
        if (punctuation) wordList = addPunctuation(wordList);

        return wordList.join(' ');
    },

    getQuoteText(size) {
        const shuffled = shuffle(QUOTES);
        let text = '';
        let targetLen = size === 'short' ? 80 : size === 'long' ? 300 : 150;
        for (const q of shuffled) {
            text += (text ? ' ' : '') + q.text;
            if (text.split(' ').length >= targetLen) break;
        }
        return text.trim();
    }
};
