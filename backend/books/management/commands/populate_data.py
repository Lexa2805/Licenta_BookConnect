from django.core.management.base import BaseCommand
from books.models import Book
from reviews.models import Review
from chat.models import ChatGroup, GroupMember
from marketplace.models import Listing


class Command(BaseCommand):
    help = 'Populate database with sample data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating sample books...')
        
        # Sample books
        books_data = [
            {
                'title': 'To Kill a Mockingbird',
                'author': 'Harper Lee',
                'isbn': '9780061120084',
                'description': 'A gripping tale of racial injustice and childhood innocence in the American South.',
                'genre': 'Fiction',
                'published_year': 1960
            },
            {
                'title': '1984',
                'author': 'George Orwell',
                'isbn': '9780451524935',
                'description': 'A dystopian social science fiction novel and cautionary tale about totalitarianism.',
                'genre': 'Science Fiction',
                'published_year': 1949
            },
            {
                'title': 'Pride and Prejudice',
                'author': 'Jane Austen',
                'isbn': '9780141439518',
                'description': 'A romantic novel of manners set in Georgian England.',
                'genre': 'Romance',
                'published_year': 1813
            },
            {
                'title': 'The Great Gatsby',
                'author': 'F. Scott Fitzgerald',
                'isbn': '9780743273565',
                'description': 'A story of the fabulously wealthy Jay Gatsby and his love for Daisy Buchanan.',
                'genre': 'Fiction',
                'published_year': 1925
            },
            {
                'title': 'Harry Potter and the Philosopher\'s Stone',
                'author': 'J.K. Rowling',
                'isbn': '9780747532699',
                'description': 'The first novel in the Harry Potter series about a young wizard.',
                'genre': 'Fantasy',
                'published_year': 1997
            },
            {
                'title': 'The Hobbit',
                'author': 'J.R.R. Tolkien',
                'isbn': '9780547928227',
                'description': 'A fantasy novel about the quest of home-loving Bilbo Baggins.',
                'genre': 'Fantasy',
                'published_year': 1937
            },
            {
                'title': 'The Catcher in the Rye',
                'author': 'J.D. Salinger',
                'isbn': '9780316769174',
                'description': 'A story about teenage rebellion and alienation.',
                'genre': 'Fiction',
                'published_year': 1951
            },
            {
                'title': 'The Lord of the Rings',
                'author': 'J.R.R. Tolkien',
                'isbn': '9780544003415',
                'description': 'An epic high-fantasy novel about the quest to destroy the One Ring.',
                'genre': 'Fantasy',
                'published_year': 1954
            },
            {
                'title': 'The Da Vinci Code',
                'author': 'Dan Brown',
                'isbn': '9780307474278',
                'description': 'A mystery thriller following symbologist Robert Langdon.',
                'genre': 'Mystery',
                'published_year': 2003
            },
            {
                'title': 'The Hunger Games',
                'author': 'Suzanne Collins',
                'isbn': '9780439023481',
                'description': 'A dystopian novel about a televised fight to the death.',
                'genre': 'Science Fiction',
                'published_year': 2008
            },
            {
                'title': 'The Alchemist',
                'author': 'Paulo Coelho',
                'isbn': '9780062315007',
                'description': 'A philosophical novel about following your dreams.',
                'genre': 'Fiction',
                'published_year': 1988
            },
            {
                'title': 'Gone Girl',
                'author': 'Gillian Flynn',
                'isbn': '9780307588371',
                'description': 'A psychological thriller about a missing wife.',
                'genre': 'Thriller',
                'published_year': 2012
            },
            {
                'title': 'The Girl with the Dragon Tattoo',
                'author': 'Stieg Larsson',
                'isbn': '9780307454546',
                'description': 'A crime thriller set in Sweden.',
                'genre': 'Mystery',
                'published_year': 2005
            },
            {
                'title': 'Sapiens: A Brief History of Humankind',
                'author': 'Yuval Noah Harari',
                'isbn': '9780062316097',
                'description': 'An exploration of the history and impact of Homo sapiens.',
                'genre': 'Non-Fiction',
                'published_year': 2011
            },
            {
                'title': 'Educated',
                'author': 'Tara Westover',
                'isbn': '9780399590504',
                'description': 'A memoir about a woman who grows up in a survivalist family.',
                'genre': 'Biography',
                'published_year': 2018
            },
            {
                'title': 'The Shining',
                'author': 'Stephen King',
                'isbn': '9780307743657',
                'description': 'A horror novel about a family isolated in a haunted hotel.',
                'genre': 'Horror',
                'published_year': 1977
            },
            {
                'title': 'Dune',
                'author': 'Frank Herbert',
                'isbn': '9780441172719',
                'description': 'A science fiction epic set on the desert planet Arrakis.',
                'genre': 'Science Fiction',
                'published_year': 1965
            },
            {
                'title': 'The Handmaid\'s Tale',
                'author': 'Margaret Atwood',
                'isbn': '9780385490818',
                'description': 'A dystopian novel about a totalitarian society.',
                'genre': 'Science Fiction',
                'published_year': 1985
            },
            {
                'title': 'Becoming',
                'author': 'Michelle Obama',
                'isbn': '9781524763138',
                'description': 'The memoir of former First Lady Michelle Obama.',
                'genre': 'Biography',
                'published_year': 2018
            },
            {
                'title': 'The Silent Patient',
                'author': 'Alex Michaelides',
                'isbn': '9781250301697',
                'description': 'A psychological thriller about a woman who stops speaking.',
                'genre': 'Thriller',
                'published_year': 2019
            },
            {
                'title': 'Where the Crawdads Sing',
                'author': 'Delia Owens',
                'isbn': '9780735219090',
                'description': 'A mystery novel set in the marshes of North Carolina.',
                'genre': 'Mystery',
                'published_year': 2018
            },
            {
                'title': 'The Book Thief',
                'author': 'Markus Zusak',
                'isbn': '9780375842207',
                'description': 'A historical novel set in Nazi Germany.',
                'genre': 'Historical Fiction',
                'published_year': 2005
            },
            {
                'title': 'Atomic Habits',
                'author': 'James Clear',
                'isbn': '9780735211292',
                'description': 'A guide to building good habits and breaking bad ones.',
                'genre': 'Non-Fiction',
                'published_year': 2018
            },
            {
                'title': 'Thinking, Fast and Slow',
                'author': 'Daniel Kahneman',
                'isbn': '9780374275631',
                'description': 'A book about the two systems that drive the way we think.',
                'genre': 'Non-Fiction',
                'published_year': 2011
            },
            {
                'title': 'Quiet: The Power of Introverts',
                'author': 'Susan Cain',
                'isbn': '9780307352156',
                'description': 'A book about the power of introverts in a world that can\'t stop talking.',
                'genre': 'Non-Fiction',
                'published_year': 2012
            },
            {
                'title': 'Steve Jobs',
                'author': 'Walter Isaacson',
                'isbn': '9781451648539',
                'description': 'The biography of the co-founder of Apple Inc.',
                'genre': 'Biography',
                'published_year': 2011
            },
            {
                'title': 'The Immortal Life of Henrietta Lacks',
                'author': 'Rebecca Skloot',
                'isbn': '9781400052189',
                'description': 'The story of the woman whose cells changed medical science.',
                'genre': 'Non-Fiction',
                'published_year': 2010
            },
            {
                'title': 'The Martian',
                'author': 'Andy Weir',
                'isbn': '9780804139021',
                'description': 'A science fiction novel about an astronaut stranded on Mars.',
                'genre': 'Science Fiction',
                'published_year': 2011
            },
            {
                'title': 'Ready Player One',
                'author': 'Ernest Cline',
                'isbn': '9780307887436',
                'description': 'A science fiction novel set in a dystopian future.',
                'genre': 'Science Fiction',
                'published_year': 2011
            },
            {
                'title': 'The Night Circus',
                'author': 'Erin Morgenstern',
                'isbn': '9780385534635',
                'description': 'A fantasy novel about a magical competition.',
                'genre': 'Fantasy',
                'published_year': 2011
            },
            {
                'title': 'Circe',
                'author': 'Madeline Miller',
                'isbn': '9780316556347',
                'description': 'A retelling of the Greek myth of Circe.',
                'genre': 'Fantasy',
                'published_year': 2018
            }
        ]

        for book_data in books_data:
            book, created = Book.objects.get_or_create(
                isbn=book_data['isbn'],
                defaults=book_data
            )
            if created:
                self.stdout.write(f'  Created: {book.title}')
            else:
                self.stdout.write(f'  Already exists: {book.title}')

        self.stdout.write('\nCreating sample chat groups...')
        
        # Sample chat groups
        groups_data = [
            {
                'name': 'Sci-Fi Lovers',
                'description': 'A group for fans of science fiction literature'
            },
            {
                'name': 'Sunday Readers',
                'description': 'Casual readers who enjoy discussing books on Sundays'
            },
            {
                'name': 'Fantasy Enthusiasts',
                'description': 'For those who love fantasy worlds and magical adventures'
            },
            {
                'name': 'Classic Literature Club',
                'description': 'Discussing timeless classics and their impact'
            }
        ]

        for group_data in groups_data:
            group, created = ChatGroup.objects.get_or_create(
                name=group_data['name'],
                defaults=group_data
            )
            if created:
                self.stdout.write(f'  Created: {group.name}')
            else:
                self.stdout.write(f'  Already exists: {group.name}')

        self.stdout.write('\nCreating sample marketplace listings...')
        
        # Sample marketplace listings
        listings_data = [
            {
                'title': '1984 - Used Copy',
                'description': 'Well-maintained copy of George Orwell\'s classic. Minor wear on cover.',
                'price': '8.99',
                'condition': 'GOOD',
                'seller_id': 'user_demo',
                'status': 'LISTED'
            },
            {
                'title': 'Harry Potter Set (Books 1-3)',
                'description': 'First three books in excellent condition. Perfect for collectors.',
                'price': '25.00',
                'condition': 'LIKE_NEW',
                'seller_id': 'user_demo',
                'status': 'LISTED'
            }
        ]

        for listing_data in listings_data:
            listing, created = Listing.objects.get_or_create(
                title=listing_data['title'],
                defaults=listing_data
            )
            if created:
                self.stdout.write(f'  Created: {listing.title}')
            else:
                self.stdout.write(f'  Already exists: {listing.title}')

        self.stdout.write(self.style.SUCCESS('\n✓ Sample data created successfully!'))
