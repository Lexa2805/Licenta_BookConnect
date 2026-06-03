describe("Autentificare BookConnect", () => {

  beforeEach(() => {
    cy.visit("/login");
  });

  it("afișează pagina de login corect", () => {
    cy.contains("Welcome Back").should("be.visible");
    cy.get('input[placeholder="Enter your username"]').should("be.visible");
    cy.get('input[placeholder="Enter your password"]').should("be.visible");
    cy.contains("Sign In").should("be.visible");
    cy.contains("Continue with Google").should("be.visible");
  });

  it("afișează eroare la credențiale greșite", () => {
    cy.get('input[placeholder="Enter your username"]').type("utilizator_inexistent");
    cy.get('input[placeholder="Enter your password"]').type("parola_gresita");
    cy.contains("Sign In").click();
    cy.wait(3000);
    cy.url().should("include", "/login");
  });

  it("autentificare reușită cu credențiale corecte", () => {
    cy.get('input[placeholder="Enter your username"]').type("Carmen");
    cy.get('input[placeholder="Enter your password"]').type("asd123");
    cy.contains("Sign In").click();
    // NextAuth are nevoie de timp să seteze sesiunea
    cy.wait(4000);
    cy.url({ timeout: 10000 }).should("not.include", "/login");
  });

  it("redirecționează utilizatorul autentificat de la /login spre home", () => {
    cy.get('input[placeholder="Enter your username"]').type("Carmen");
    cy.get('input[placeholder="Enter your password"]').type("asd123");
    cy.contains("Sign In").click();
    cy.wait(4000);
    cy.url({ timeout: 10000 }).should("not.include", "/login");
    cy.visit("/login");
    cy.wait(2000);
    cy.url().should("not.include", "/login");
  });

  it("rutele protejate redirecționează la login dacă nu ești autentificat", () => {
    cy.visit("/library");
    cy.wait(1000)
    cy.url().should("include", "/login");
    cy.visit("/marketplace");
    cy.url().should("include", "/login");
  });

});