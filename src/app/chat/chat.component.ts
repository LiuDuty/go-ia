import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZaiService } from '../zai.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit {

  texto: string = '';
  conversas: { pergunta: string; resposta: string }[] = [];
  sessionId: string = 'session1';
  enviando: boolean = false;

  private readonly STORAGE_KEY = 'chatHistorico_zai';

  @ViewChild('chatBox') chatBox!: ElementRef;

  constructor(private zaiService: ZaiService) { }

  ngOnInit(): void {
    this.carregarHistorico();
  }

  carregarHistorico(): void {
    const historicoSalvo = localStorage.getItem(this.STORAGE_KEY);
    if (historicoSalvo) {
      try {
        this.conversas = JSON.parse(historicoSalvo);
        // Ensure scroll to top to see newest messages (which are at index 0)
        setTimeout(() => this.scrollToTop(), 100);
      } catch (error) {
        console.error('Erro ao carregar histórico do localStorage:', error);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  salvarHistorico(): void {
    const historicoParaSalvar = JSON.stringify(this.conversas);
    localStorage.setItem(this.STORAGE_KEY, historicoParaSalvar);
  }

  enviar() {
    const pergunta = this.texto.trim();
    if (!pergunta || this.enviando) return;

    this.enviando = true;

    // Add new message to the BEGINNING of the array (Newest First)
    this.conversas.unshift({ pergunta, resposta: '⏳ Digitando...' });
    this.texto = '';
    this.scrollToTop();

    this.zaiService.enviarMensagem(pergunta, this.sessionId).subscribe({
      next: (res: any) => {
        const respostaComBr = res.resposta
          ? res.resposta.replace(/\n/g, '<br>')
          : '⚠️ Sem resposta do servidor.';

        // Update the first element (newest)
        this.conversas[0].resposta = respostaComBr;
        this.enviando = false;
        this.scrollToTop();

        this.salvarHistorico();
      },
      error: (err: any) => {
        console.error('❌ Erro ao enviar mensagem', err);
        // Update the first element
        this.conversas[0].resposta =
          '💥 Erro ao obter resposta. Tente novamente.';
        this.enviando = false;

        this.salvarHistorico();
      },
    });
  }

  scrollToTop() {
    setTimeout(() => {
      const el = this.chatBox?.nativeElement;
      if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  limparHistorico(): void {
    this.conversas = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }
}