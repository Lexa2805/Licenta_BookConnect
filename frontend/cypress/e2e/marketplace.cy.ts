function loginAsCarmen() {
  cy.visit("/login");
  cy.get('input[placeholder="Enter your username"]').type("Carmen");
  cy.get('input[placeholder="Enter your password"]').type("asd123");
  cy.contains("Sign In").click();
  cy.wait(4000);
  cy.url({ timeout: 10000 }).should("not.include", "/login");
}

describe("Marketplace BookConnect", () => {
  it("afișează listările disponibile în marketplace", () => {
    loginAsCarmen();

    cy.visit("/marketplace");
    cy.contains("Marketplace").should("be.visible");

    cy.get("article:visible", { timeout: 10000 }).should("have.length.at.least", 1);
    cy.get("article:visible").each(($card) => {
      cy.wrap($card).contains("Lei").should("be.visible");
    });
  });

  it("adaugă o listare nouă și verifică că apare în marketplace", () => {
    loginAsCarmen();

    cy.visit("/marketplace");
    cy.contains("button", "List a book").click();
    cy.wait(2000);

    cy.get('input[name="title"]').type("Test Carte Cypress");
    cy.get('input[name="author"]').type("Autor Test");
    cy.get('textarea[name="description"]').type("Descriere test carte pentru Cypress");
    cy.get('input[name="price"]').type("15");
    cy.get('input[type="radio"][name="condition"][value="GOOD"]').check({ force: true });
    cy.get('select[name="genre"]').select("Other");

    cy.contains("button", "List for Sale").click();
    cy.wait(3000);

    cy.url({ timeout: 10000 }).should("include", "/marketplace");
    cy.contains("Test Carte Cypress", { timeout: 10000 }).should("be.visible");
  });

  it("caută o carte în marketplace și verifică filtrarea rezultatelor", () => {
  loginAsCarmen();

  cy.visit("/marketplace");
  cy.get('input[placeholder="Search by title, author, or ISBN..."]').type("Me before you");
  cy.wait(1000);

  cy.get("article:visible", { timeout: 10000 }).should("have.length.at.least", 1);
  cy.get("article:visible").each(($card) => {
    cy.wrap($card).contains(/Me before you/i).should("be.visible");
  });
  });
});

export {};
