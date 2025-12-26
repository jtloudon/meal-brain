/**
 * Mock email service for capturing magic links in E2E tests.
 * In tests, we intercept Supabase's email send and extract the magic link.
 */

export class MockEmailService {
  private emails: Map<string, string> = new Map();

  /**
   * Captures an email and extracts the magic link.
   * In a real test, this would intercept the Supabase email service.
   */
  async captureEmail(to: string, body: string) {
    // Extract magic link from email body
    const linkMatch = body.match(
      /https?:\/\/[^\s]+\/auth\/callback[^\s]*/
    );
    if (linkMatch) {
      this.emails.set(to, linkMatch[0]);
    }
  }

  /**
   * Gets the latest magic link sent to an email address.
   * For Supabase local dev, we'll use the Mailpit API to fetch emails.
   */
  async getLatestEmail(to: string, maxAttempts = 10): Promise<string> {
    // In local dev, Supabase sends emails to Mailpit (localhost:54324)
    // We need to fetch from the Mailpit API
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.log(`[MOCK-EMAIL] Attempt ${attempt + 1}/${maxAttempts} to find email for ${to}`);
        const response = await fetch('http://127.0.0.1:54324/api/v1/messages');

        if (!response.ok) {
          throw new Error(`Mailpit API returned ${response.status}`);
        }

        const data = await response.json();
        console.log(`[MOCK-EMAIL] Found ${data.messages?.length || 0} total messages`);

        // Find the most recent email to this address
        const message = data.messages?.find((msg: any) =>
          msg.To?.some((recipient: any) =>
            recipient.Address.toLowerCase() === to.toLowerCase()
          )
        );

        if (!message) {
          console.log(`[MOCK-EMAIL] No message found for ${to}, waiting 1s...`);
          // Wait and retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        console.log(`[MOCK-EMAIL] Found message ID ${message.ID} for ${to}`);

        // Get the full message content
        const messageResponse = await fetch(
          `http://127.0.0.1:54324/api/v1/message/${message.ID}`
        );

        if (!messageResponse.ok) {
          throw new Error(
            `Mailpit message API returned ${messageResponse.status}`
          );
        }

        const messageData = await messageResponse.json();

        // Extract magic link from HTML or Text content
        const content = messageData.HTML || messageData.Text;
        console.log(`[MOCK-EMAIL] Email content preview:`, content?.substring(0, 200));
        console.log(`[MOCK-EMAIL] Message data keys:`, Object.keys(messageData));

        // Match Supabase magic link URL (goes to /auth/v1/verify, then redirects to our callback)
        const linkMatch = content.match(
          /https?:\/\/[^\s"]+\/auth\/v1\/verify\?[^\s")]+/
        );

        if (!linkMatch) {
          console.error(`[MOCK-EMAIL] Full email content:`, JSON.stringify(messageData, null, 2));
          throw new Error(`No magic link found in email content`);
        }

        // Decode HTML entities (&amp; -> &)
        const decodedLink = linkMatch[0]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"');

        console.log(`[MOCK-EMAIL] Extracted magic link:`, decodedLink);
        return decodedLink;
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw new Error(
            `Failed to get email for ${to} after ${maxAttempts} attempts: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new Error(`No email found for ${to} after ${maxAttempts} attempts`);
  }

  /**
   * Clears all captured emails.
   */
  clear() {
    this.emails.clear();
  }
}

export const mockEmailService = new MockEmailService();
