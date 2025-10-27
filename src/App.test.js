import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

test("renders lineup builder heading", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { name: /Nibacos-kokoonpanon rakentaja/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 2, name: /Ketju 1/i })
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Lataa kokoonpano/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Tallenna kokoonpano/i })).toBeInTheDocument();
});

test("can navigate between main and roster views", async () => {
  render(<App />);
  const rosterButton = screen.getByRole("button", { name: /Pelaajaluettelo/i });
  await userEvent.click(rosterButton);
  const addModalButton = screen.getByRole("button", { name: /Lisää pelaaja/i });
  expect(addModalButton).toBeInTheDocument();
  expect(screen.queryByTestId("add-player-form")).not.toBeInTheDocument();
  await userEvent.click(addModalButton);
  expect(screen.getByTestId("add-player-form")).toBeInTheDocument();
  const modal = screen.getByRole("dialog");
  await userEvent.click(within(modal).getByRole("button", { name: /Peruuta/i }));
  await waitFor(() =>
    expect(screen.queryByTestId("add-player-form")).not.toBeInTheDocument()
  );
  const mainButton = screen.getByRole("button", { name: /Etusivu/i });
  await userEvent.click(mainButton);
  await waitFor(() =>
    expect(screen.queryByTestId("add-player-form")).not.toBeInTheDocument()
  );
});

test("shows import and export controls", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: /Pelaajaluettelo/i }));
  expect(screen.getByRole("button", { name: /Lataa tiedostosta/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Tallenna tiedostoon/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Lisää pelaaja/i })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Etusivu/i }));
  expect(screen.getByRole("button", { name: /Tulosta kokoonpano PDF/i })).toBeInTheDocument();
});

test("allows editing bench player information", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: /Pelaajaluettelo/i }));
  const editButtons = screen.getAllByRole("button", { name: /Muokkaa/i });
  const benchItem = editButtons[0].closest("li");
  expect(benchItem).not.toBeNull();
  await userEvent.click(editButtons[0]);

  const scoped = within(benchItem);
  const nameInput = scoped.getByLabelText(/Nimi/i);
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, "Matias Laine Jr");

  const saveButton = scoped.getByRole("button", { name: /Tallenna/i });
  await userEvent.click(saveButton);

  const updatedLabel = await screen.findByText(/Matias Laine Jr/, {
    selector: "span",
  });
  expect(updatedLabel).toBeInTheDocument();
});

test("can add and remove a player from the roster", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: /Pelaajaluettelo/i }));
  await userEvent.click(screen.getByRole("button", { name: /^Lisää pelaaja$/i }));
  const addForm = screen.getByTestId("add-player-form");

  await userEvent.type(within(addForm).getByLabelText(/^Numero$/i), "88");
  await userEvent.type(within(addForm).getByLabelText(/^Nimi$/i), "Testi Pelaaja");
  await userEvent.click(within(addForm).getByLabelText("OP"));
  await userEvent.click(within(addForm).getByRole("button", { name: /Lisää pelaaja/i }));
  await waitFor(() =>
    expect(screen.queryByTestId("add-player-form")).not.toBeInTheDocument()
  );

  const playerSpan = await screen.findByText(/88 Testi Pelaaja/, { selector: "span" });
  expect(playerSpan).toBeInTheDocument();

  const playerItem = playerSpan.closest("li");
  expect(playerItem).not.toBeNull();

  const removeButton = within(playerItem).getByRole("button", { name: /Poista/i });
  await userEvent.click(removeButton);

  await waitFor(() =>
    expect(screen.queryByText(/88 Testi Pelaaja/, { selector: "span" })).not.toBeInTheDocument()
  );
});
