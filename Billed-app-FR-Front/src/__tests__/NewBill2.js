/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES_PATH } from "../constants/routes.js";
import Router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    document.body.innerHTML = `<div id="root"></div>`;
    Router();
    document.body.innerHTML = NewBillUI();
    window.onNavigate(ROUTES_PATH.NewBill);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("When I am on NewBill Page", () => {
    test("Then  e-mail icon in vertical layout should be highlighted", async () => {
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon).toHaveClass("active-icon");
    });

    describe("When I send the form", () => {
      it("Should have valid inputs", () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const mockedBill = {
          type: "Hôtel et logement",
          name: "encore",
          date: "2004-04-04",
          amount: 400,
          vat: "80",
          pct: 20,
          commentary: "séminaire billed",
          fileName: "test.jpg",
          fileUrl: "../test.jpg",
        };
        const form = screen.getByTestId("form-new-bill");
        screen.getByTestId("expense-type").value = mockedBill.type;
        screen.getByTestId("expense-name").value = mockedBill.name;
        screen.getByTestId("datepicker").value = mockedBill.date;
        screen.getByTestId("amount").value = mockedBill.amount;
        screen.getByTestId("vat").value = mockedBill.vat;
        screen.getByTestId("pct").value = mockedBill.pct;
        screen.getByTestId("commentary").value = mockedBill.commentary;
        newBill.fileName = mockedBill.fileName;
        newBill.fileUrl = mockedBill.fileUrl;

        newBill.updateBill = jest.fn();

        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        expect(handleSubmit).toHaveBeenCalled();
        expect(newBill.updateBill).toHaveBeenCalled();
      });
      it("Should have empty inputs", () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
        const mockedBill = {
          type: "",
          name: "",
          date: "",
          amount: undefined,
          vat: "",
          pct: undefined,
          commentary: "",
          fileName: "",
          fileUrl: "",
        };

        screen.getByTestId("expense-type").value = mockedBill.type;
        screen.getByTestId("expense-name").value = mockedBill.name;
        screen.getByTestId("datepicker").value = mockedBill.date;
        screen.getByTestId("amount").value = mockedBill.amount;
        screen.getByTestId("vat").value = mockedBill.vat;
        screen.getByTestId("pct").value = mockedBill.pct;
        screen.getByTestId("commentary").value = mockedBill.commentary;
        newBill.fileName = mockedBill.fileName;
        newBill.fileUrl = mockedBill.fileUrl;

        newBill.updateBill = jest.fn();
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        expect(screen.getByTestId("expense-type")).toBeRequired();
        expect(screen.getByTestId("expense-name")).not.toBeRequired();
        expect(screen.getByTestId("datepicker")).toBeRequired();
        expect(screen.getByTestId("amount")).toBeRequired();
        expect(screen.getByTestId("vat")).not.toBeRequired();
        expect(screen.getByTestId("pct")).toBeRequired();
        expect(screen.getByTestId("commentary")).not.toBeRequired();
        expect(screen.getByTestId("file")).toBeRequired();
      });
    });

    describe("When the user give a file", () => {
      it("Should have the good format", () => {});
      it("Should have the bad format", () => {});
    });

    describe("When an error occurs on the API", () => {
      it("Then show an error 500 ", async () => {});
      it("Then show an error 400 ", async () => {});
    });
  });
});
