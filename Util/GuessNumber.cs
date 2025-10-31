namespace games.Util
{
    public class GuessNumber
    {
        public GuessNumber() { }
        public void GetGuessNumber()
        {
            Console.Title = "Guess the Number Game";
            Random random = new Random();
            int numberToGuess = random.Next(1, 101);
            int userGuess = 0;
            int attempts = 0;

            Console.WriteLine("Welcome to Guess the Number!");
            Console.WriteLine("I'm thinking of a number between 1 and 100.");

            while (userGuess != numberToGuess)
            {
                Console.Write("Enter your guess: ");
                string input = Console.ReadLine();

                if (int.TryParse(input, out userGuess))
                {
                    attempts++;
                    if (userGuess > numberToGuess)
                        Console.WriteLine("Too high! Try again.");
                    else if (userGuess < numberToGuess)
                        Console.WriteLine("Too low! Try again.");
                    else
                        Console.WriteLine($"🎉 Correct! The number was {numberToGuess}. You got it in {attempts} tries!");
                }
                else
                {
                    Console.WriteLine("Please enter a valid number!");
                }
            }

            Console.WriteLine("\nPress any key to exit...");
            Console.ReadKey();
        }
    }
}
