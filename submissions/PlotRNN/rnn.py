import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

with open("dataset.txt", "r", encoding="utf-8") as f:
    text = f.read().lower().replace("\n", " ")

chars = sorted(list(set(text)))
char2idx = {ch: i for i, ch in enumerate(chars)}
idx2char = {i: ch for i, ch in enumerate(chars)}
vocab_size = len(chars)


sequence_length = 50 
hidden_size = 256    
num_layers = 3
learning_rate = 0.005
num_epochs = 300    
batch_size = 1

data = []
target = []

for i in range(len(text) - sequence_length):
    seq = text[i:i+sequence_length]
    tgt = text[i + sequence_length]
    data.append([char2idx[ch] for ch in seq])
    target.append(char2idx[tgt])

data = torch.tensor(data, dtype=torch.long)
target = torch.tensor(target, dtype=torch.long)

class CharRNN(nn.Module):
    def __init__(self, vocab_size, hidden_size=256, num_layers=2):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, hidden_size)
        self.rnn = nn.RNN(hidden_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, vocab_size)
        self.hidden_size = hidden_size
        self.num_layers = num_layers

    def forward(self, x, hidden):
        x = self.embed(x)
        out, hidden = self.rnn(x, hidden)
        out = self.fc(out[:, -1, :])
        return out, hidden

model = CharRNN(vocab_size, hidden_size, num_layers)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=learning_rate)

for epoch in range(num_epochs):
    hidden = torch.zeros(model.num_layers, data.size(0), model.hidden_size)
    optimizer.zero_grad()
    output, hidden = model(data, hidden)
    loss = criterion(output, target)
    loss.backward()
    optimizer.step()
    if (epoch + 1) % 20 == 0:
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {loss.item():.4f}")

def generate_text(model, seed, length=300, temperature=0.8):  
    model.eval()
    chars_out = [ch for ch in seed.lower()]
    hidden = torch.zeros(model.num_layers, 1, model.hidden_size)
    for _ in range(length):
        seq = [char2idx.get(ch, 0) for ch in chars_out[-sequence_length:]]  
        seq_tensor = torch.tensor([seq], dtype=torch.long)
        output, hidden = model(seq_tensor, hidden)
        probs = torch.softmax(output / temperature, dim=1).detach().numpy().ravel()
        next_idx = np.random.choice(len(probs), p=probs)
        chars_out.append(idx2char[next_idx])
    return ''.join(chars_out)

seed_text = "There once was "
generated = generate_text(model, seed_text, length=400, temperature=0.6)
print("\nGenerated text:\n")
print(generated)

torch.save({
    'model_state_dict': model.state_dict(),
    'char2idx': char2idx,
    'idx2char': idx2char,
    'hidden_size': model.hidden_size,
    'num_layers': model.num_layers,
}, "plotrnn.pth")

print("\nModel saved as plotrnn.pth")