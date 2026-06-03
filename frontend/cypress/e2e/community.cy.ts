function loginAsCarmen() {
  cy.visit("/login");
  cy.get('input[placeholder="Enter your username"]').type("Carmen");
  cy.get('input[placeholder="Enter your password"]').type("asd123");
  cy.contains("Sign In").click();
  cy.wait(4000);
  cy.url({ timeout: 10000 }).should("not.include", "/login");
}

describe("Community BookConnect", () => {
  it("afișează pagina Community cu secțiunile corecte", () => {
    loginAsCarmen();

    cy.visit("/community");
    cy.contains("Your groups", { timeout: 10000 }).should("be.visible");
    cy.contains("Direct messages").should("be.visible");
    cy.contains("Find people & groups").should("be.visible");
  });

  it("creează un grup nou și verifică că apare în lista de grupuri", () => {
    loginAsCarmen();

    cy.visit("/community");
    cy.contains("section", "Your groups", { timeout: 10000 }).within(() => {
      cy.contains("button", "Create").click();
      cy.wait(2000);
      cy.get('input[placeholder="Group name"]').type("Grup Test Cypress");
      cy.get('textarea[placeholder="Short description"]').type("Grup creat automat de Cypress");
      cy.contains("button", "Create group").click();
    });

    cy.wait(3000);
    cy.contains("Grup Test Cypress", { timeout: 10000 }).should("be.visible");
  });

  it("trimite un mesaj direct și verifică că apare în conversație", () => {
    loginAsCarmen();

    cy.visit("/community");
    cy.contains("section", "Direct messages", { timeout: 10000 }).then(($section) => {
      if ($section.text().includes("Show all messages")) {
        cy.wrap($section).contains("button", "Show all messages").click();
        cy.wait(2000);
      }
    });

    cy.contains("section", "Direct messages").contains("button", "Ale1").click();
    cy.wait(2000);

    cy.get('textarea[placeholder="Write a message, add an emoji, or share a file..."]')
      .should("be.enabled")
      .type("Mesaj test Cypress");
    cy.get('button[aria-label="Send message"]').click();
    cy.wait(2000);

    cy.contains("p", "Mesaj test Cypress", { timeout: 10000 }).should("be.visible");
  });
});

export {};
