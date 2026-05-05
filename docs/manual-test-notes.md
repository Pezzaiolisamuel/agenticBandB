# Manual Test Notes

## Booking consistency

1. Create a booking from the website form.
2. Create a booking from the chat assistant using `create_booking_request`.
3. Create a booking from the voice assistant using `create_booking_request`.
4. Open `/admin/bookings`.
5. Verify that all created bookings appear in the admin list, including `pending_admin_confirmation`.
6. Verify that the stored booking source is correct for each booking flow.
7. For chat, verify that saving details in `chat_booking_state` alone does not count as a finalized booking.
8. After the user explicitly says they want to book or proceed, verify that `create_booking_request` inserts a row in `public.bookings`.

## Chat and voice privacy

1. Create chat session A and provide a name and email.
2. Open a new incognito browser session B.
3. Ask: "what is my email?"
4. Verify the assistant does not know the data from session A.
5. Click "Start new chat" / "Nuova chat".
6. Ask again for previously provided personal details.
7. Verify the assistant asks the user to provide the details again and does not reuse the old draft.
